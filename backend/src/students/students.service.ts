import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) { }

  private parseDateSafe(dateString?: string): Date | null | undefined {
    if (dateString === undefined) return undefined;
    if (dateString === null || dateString.trim() === '') return null;
    return new Date(dateString);
  }

  create(createStudentDto: CreateStudentDto, usuarioCargaId: number) {
    const { librosFolios, ...studentData } = createStudentDto;
    return this.prisma.estudiante.create({
      data: {
        ...studentData,
        fechaNacimiento: this.parseDateSafe(studentData.fechaNacimiento) as any,
        fechaIngreso: this.parseDateSafe(studentData.fechaIngreso),
        fechaEgreso: this.parseDateSafe(studentData.fechaEgreso),
        paseFecha: this.parseDateSafe(studentData.paseFecha),
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

  async createBulk(createStudentDtos: CreateStudentDto[], usuarioCargaId: number) {
    const dataToInsert = createStudentDtos.map(dto => {
      // Ignoramos librosFolios en la carga masiva (se agregan individualmente si se requiere)
      const { librosFolios, ...studentData } = dto;
      return {
        ...studentData,
        fechaNacimiento: this.parseDateSafe(studentData.fechaNacimiento) as any,
        fechaIngreso: this.parseDateSafe(studentData.fechaIngreso),
        fechaEgreso: this.parseDateSafe(studentData.fechaEgreso),
        paseFecha: this.parseDateSafe(studentData.paseFecha),
        usuarioCargaId: usuarioCargaId,
      };
    });

    // skipDuplicates: ignora filas donde el DNI ya existe (Unique Constraint)
    const result = await this.prisma.estudiante.createMany({
      data: dataToInsert as any, // Hacemos un casting a any para que Prisma procese los opcionales
      skipDuplicates: true,
    });

    return {
      message: 'Carga masiva procesada',
      recordsInserted: result.count,
    };
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

    if (studentData.fechaNacimiento !== undefined) data.fechaNacimiento = this.parseDateSafe(studentData.fechaNacimiento);
    if (studentData.fechaIngreso !== undefined) data.fechaIngreso = this.parseDateSafe(studentData.fechaIngreso);
    if (studentData.fechaEgreso !== undefined) data.fechaEgreso = this.parseDateSafe(studentData.fechaEgreso);
    if (studentData.paseFecha !== undefined) data.paseFecha = this.parseDateSafe(studentData.paseFecha);

    if (librosFolios !== undefined) {
      data.librosFolios = {
        deleteMany: {},
        create: librosFolios.map((lf: any) => ({
          libro: lf.libro,
          folio: lf.folio,
        })),
      };
    }

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
  }, user?: { rol: string; userId: number }) {
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
          none: {}
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

    // RLS Preceptores
    if (user?.rol === 'PRECEPTOR') {
      const preceptorFilter = {
        curso: {
          asignaciones: {
            some: { usuarioId: user.userId },
          },
        },
      };

      if (!where.inscripciones) {
        where.inscripciones = { some: preceptorFilter };
      } else if (where.inscripciones.some) {
        where.inscripciones.some = {
          AND: [where.inscripciones.some, preceptorFilter],
        };
      } else if (where.inscripciones.none) {
        // Los alumnos sin curso no pertenecen a ningún preceptor, forzamos resultado vacío
        where.inscripciones.some = preceptorFilter;
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

  async getMovements(filters?: {
    dni?: string;
    curso?: string;
    division?: string;
    cicloLectivo?: number;
    fechaIngreso?: string;
    fechaEgreso?: string;
  }) {
    const where: any = {};
    const andConditions: any[] = [
      { OR: [
        { fechaIngreso: { not: null } },
        { paseFecha: { not: null } },
        { fechaEgreso: { not: null } },
        { condicion: { in: ['INGRESO', 'PASE'] } }
      ]}
    ];

    if (filters?.dni) andConditions.push({ dni: { contains: filters.dni, mode: 'insensitive' } });
    
    if (filters?.curso || filters?.division || filters?.cicloLectivo) {
      andConditions.push({
        inscripciones: {
          some: {
            curso: {
              ...(filters.curso && { anioCurso: filters.curso }),
              ...(filters.division && { division: filters.division }),
              ...(filters.cicloLectivo && { cicloLectivo: { anio: +filters.cicloLectivo } })
            }
          }
        }
      });
    }

    if (filters?.fechaIngreso) {
      const start = new Date(filters.fechaIngreso);
      const end = new Date(filters.fechaIngreso);
      end.setHours(23,59,59,999);
      andConditions.push({ fechaIngreso: { gte: start, lte: end } });
    }

    if (filters?.fechaEgreso) {
      const start = new Date(filters.fechaEgreso);
      const end = new Date(filters.fechaEgreso);
      end.setHours(23,59,59,999);
      andConditions.push({
        OR: [
          { paseFecha: { gte: start, lte: end } },
          { fechaEgreso: { gte: start, lte: end } }
        ]
      });
    }

    where.AND = andConditions;

    return this.prisma.estudiante.findMany({
      where,
      include: {
        inscripciones: {
          include: {
            curso: {
              include: { cicloLectivo: true }
            }
          }
        }
      },
      orderBy: [
        { fechaIngreso: 'desc' }
      ]
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

    const currentReprobadas = inscripcionesConLogica.length > 0
      ? inscripcionesConLogica[inscripcionesConLogica.length - 1].reprobadasCount
      : 0;

    let nivelRiesgo = 'Sin Riesgo';
    if (currentReprobadas >= 1 && currentReprobadas <= 4) nivelRiesgo = 'Riesgo Bajo';
    if (currentReprobadas === 5 || currentReprobadas === 6) nivelRiesgo = 'Riesgo Medio';
    if (currentReprobadas > 6) nivelRiesgo = 'Riesgo Alto';

    return {
      ...student,
      nivelRiesgo,
      reprobadasAcumuladas: currentReprobadas,
      inscripciones: inscripcionesVista
    };
  }
}
