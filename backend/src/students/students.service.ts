import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) { }

  create(createStudentDto: CreateStudentDto, usuarioCargaId: number) {
    const { librosFolios, ...studentData } = createStudentDto;
    return this.prisma.estudiante.create({
      data: {
        ...studentData,
        fechaNacimiento: new Date(studentData.fechaNacimiento),
        fechaIngreso: studentData.fechaIngreso
          ? new Date(studentData.fechaIngreso)
          : undefined,
        usuarioCarga: { connect: { id: usuarioCargaId } },
        librosFolios: librosFolios
          ? {
            create: librosFolios,
          }
          : undefined,
      },
      include: { librosFolios: true },
    });
  }

  update(
    id: number,
    updateStudentDto: UpdateStudentDto,
    usuarioModificacionId: number,
  ) {
    const { librosFolios, ...studentData } = updateStudentDto;
    const data: any = {
      ...studentData,
      usuarioModificacion: { connect: { id: usuarioModificacionId } },
    };

    if (studentData.fechaNacimiento)
      data.fechaNacimiento = new Date(studentData.fechaNacimiento);
    if (studentData.fechaIngreso)
      data.fechaIngreso = new Date(studentData.fechaIngreso);
    if (studentData.fechaEgreso)
      data.fechaEgreso = new Date(studentData.fechaEgreso);

    return this.prisma.estudiante.update({
      where: { id },
      data,
      include: { librosFolios: true },
    });
  }

  findAll(filters?: {
    search?: string;
    cicloLectivo?: number;
    curso?: string;
    division?: string;
    turno?: any;
    condicion?: any;
    sinCurso?: boolean; // New filter
  }) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { dni: { contains: filters.search, mode: 'insensitive' } },
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { apellido: { contains: filters.search, mode: 'insensitive' } },
      ];
    } else {
      if (filters?.condicion) where.condicion = filters.condicion;

      // Si se pide explícitamente "sin curso" (para asignación)
      if (filters?.sinCurso) {
        where.inscripciones = {
          none: {
            curso: {
              cicloLectivo: { anio: +(filters.cicloLectivo || new Date().getFullYear()) }
            }
          }
        };
      }
      // Si hay filtros de cursada
      else if (
        filters?.cicloLectivo ||
        filters?.curso ||
        filters?.division ||
        filters?.turno
      ) {
        where.inscripciones = {
          some: {
            curso: {
              ...(filters.cicloLectivo && {
                cicloLectivo: { anio: +filters.cicloLectivo },
              }),
              ...(filters.curso && { anioCurso: filters.curso }),
              ...(filters.division && { division: filters.division }),
              ...(filters.turno && { turno: filters.turno }),
            },
          },
        };
      }
    }

    return this.prisma.estudiante.findMany({
      where,
      include: {
        librosFolios: true,
        inscripciones: {
          where: {
            curso: {
              ...(filters?.cicloLectivo && {
                cicloLectivo: { anio: +filters.cicloLectivo },
              }),
            }
          },
          include: {
            curso: {
              include: {
                cicloLectivo: true,
                orientacion: true
              },
            },
          },
        },
      },
      orderBy: { apellido: 'asc' },
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.estudiante.findUnique({
      where: { id },
      include: {
        librosFolios: true,
        inscripciones: {
          include: {
            curso: {
              include: {
                cicloLectivo: true,
                orientacion: true
              }
            },
            calificaciones: { include: { materia: true } },
            asistencias: true
          },
        },
      },
    });

    if (!student) return null;

    // Jerarquía de instancias de mayor a menor peso para determinar la nota final actual de la materia
    const instanciaWeight: Record<string, number> = {
      'FINAL': 7,
      'COMPLEMENTARIO_FEB': 6,
      'COMPLEMENTARIO_DIC': 5,
      'CIERRE': 4,
      'PFA': 3,
      'INFORME_2': 2,
      'INFORME_1': 1
    };

    // Procesar cada inscripción para calcular reprobadas y condición
    // Ordenar inscripciones cronológicamente para el cálculo acumulativo
    const inscripcionesOrdenadas = [...student.inscripciones].sort((a, b) =>
      a.curso.cicloLectivo.anio - b.curso.cicloLectivo.anio
    );

    // Set para rastrear materias adeudadas históricamente
    // Usaremos un Map<materiaId, anioCurso> para saber de qué año es la deuda
    const deudasSustentadas = new Map<number, string>();

    const inscripcionesConLogica = inscripcionesOrdenadas.map((ins, index) => {
      const anioCursoActual = ins.curso.anioCurso;
      const anioCursoAnterior = index > 0 ? inscripcionesOrdenadas[index - 1].curso.anioCurso : null;

      // 1. Detectar Repitencia: Si el nivel es el mismo que el anterior, reiniciamos deudas de ese nivel
      if (anioCursoActual === anioCursoAnterior) {
        for (const [materiaId, nivelDeuda] of deudasSustentadas.entries()) {
          if (nivelDeuda === anioCursoActual) {
            deudasSustentadas.delete(materiaId);
          }
        }
      }

      // 2. Determinar la nota final de cada materia en ESTE ciclo
      const materiasDelCiclo = new Map<number, any>();
      ins.calificaciones.forEach(cal => {
        const existing = materiasDelCiclo.get(cal.materiaId);
        if (!existing || (instanciaWeight[cal.instancia] || 0) > (instanciaWeight[existing.instancia] || 0)) {
          materiasDelCiclo.set(cal.materiaId, cal);
        }
      });

      // 3. Actualizar el estado global de deudas
      materiasDelCiclo.forEach((cal) => {
        if (cal.nota < 6) {
          deudasSustentadas.set(cal.materiaId, anioCursoActual);
        } else {
          deudasSustentadas.delete(cal.materiaId); // Se sanea si aprueba (sea previa o actual)
        }
      });

      // 4. Determinar condición basada en la deuda ACUMULADA filtrada por la regla de repitencia
      const reprobadasCount = deudasSustentadas.size;
      const condicion = reprobadasCount < 5 ? 'Pasa de curso' : 'Repite';

      return {
        ...ins,
        reprobadasCount,
        condicionCiclo: condicion
      };
    });

    // Reordenar descendentemente para la vista (más reciente primero) si es necesario, 
    // pero el frontend suele manejarse con el orden que recibe o tiene su propio sort.
    // Para mantener consistencia con la vista previa, invertimos si estaba llegando desc.
    // Usualmente Prisma devuelve en orden de inserción o id. 
    // Vamos a devolverlas ordenadas inversamente (más nuevo arriba) para el frontend.
    const inscripcionesVista = inscripcionesConLogica.sort((a, b) =>
      b.curso.cicloLectivo.anio - a.curso.cicloLectivo.anio
    );

    return {
      ...student,
      inscripciones: inscripcionesVista
    };
  }
}
