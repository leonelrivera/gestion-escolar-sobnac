import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CyclesService } from '../cycles/cycles.service';

@Injectable()
export class GradesService {
  constructor(
    private prisma: PrismaService,
    private cycles: CyclesService,
  ) { }

  async create(createGradeDto: CreateGradeDto) {
    console.log('DTO RECIBIDO EN BACKEND:', createGradeDto);
    const { estudianteId, materiaId, cuatrimestre, instancia, nota, courseId } = createGradeDto;

    // 1. Validar curso e inscripción
    const inscripcion = await this.prisma.inscripcion.findFirst({
      where: {
        estudianteId,
        cursoId: courseId,
      },
      include: { curso: true }
    });

    if (!inscripcion) throw new ForbiddenException('Estudiante no inscrito en este curso');
    const cicloLectivoId = inscripcion.curso.cicloLectivoId;

    // 2. Validar si el periodo está cerrado
    const isCerrado = await this.cycles.isCerrado(
      cicloLectivoId,
      instancia,
      cuatrimestre,
    );

    if (isCerrado) {
      throw new ForbiddenException(
        `La instancia ${instancia} (Cuatrimestre ${cuatrimestre}) está CERRADA.`
      );
    }

    if (nota === -1 || nota === null) {
      try {
        await this.prisma.calificacion.delete({
          where: {
            inscripcionId_materiaId_cuatrimestre_instancia: {
              inscripcionId: inscripcion.id,
              materiaId,
              cuatrimestre,
              instancia,
            },
          },
        });
        require('fs').appendFileSync('debug_log.txt', `DELETED OK: ${JSON.stringify(createGradeDto)}\n`);
      } catch (e: any) {
        require('fs').appendFileSync('debug_log.txt', `DELETE FAILED: ${JSON.stringify(createGradeDto)} - ERROR: ${e.message}\n`);
        if (e.code !== 'P2025') { // P2025 es Record to delete does not exist.
          console.error('Error deleting grade:', e);
          throw e;
        }
      }
      return { success: true, action: 'deleted' };
    }

    require('fs').appendFileSync('debug_log.txt', `UPSERTING: ${JSON.stringify(createGradeDto)}\n`);
    return this.prisma.calificacion.upsert({
      where: {
        inscripcionId_materiaId_cuatrimestre_instancia: {
          inscripcionId: inscripcion.id,
          materiaId,
          cuatrimestre,
          instancia,
        },
      },
      update: {
        nota: +nota,
        fecha: new Date(),
        usuarioCargaId: 1, // TODO: Get from auth
      },
      create: {
        inscripcionId: inscripcion.id,
        materiaId,
        cuatrimestre,
        instancia,
        nota: +nota,
        fecha: new Date(),
        usuarioCargaId: 1, // TODO: Get from auth
      },
    });
  }

  async getMatrix(courseId: number, subjectId: number) {
    // 0. Obtener info del curso para saber el ciclo lectivo
    const course = await this.prisma.curso.findUnique({ where: { id: courseId } });
    if (!course) throw new ForbiddenException('Curso no encontrado');

    // 1. Obtener parámetros de ciclo (periodos cerrados/abiertos)
    const periods = await this.cycles.getParametros(course.cicloLectivoId);

    // 2. Obtener inscripciones de ese curso
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { cursoId: courseId, estudiante: { condicion: { not: 'PASE' } } },
      include: {
        estudiante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
          }
        },
        calificaciones: {
          where: { materiaId: subjectId }
        }
      },
      orderBy: { estudiante: { apellido: 'asc' } },
    });

    // 3. Estructurar respuesta Matrix
    const matrix = inscripciones.map((ins) => {
      const gradesMap: Record<string, any> = {};

      ins.calificaciones.forEach((g) => {
        const key = `${g.cuatrimestre}-${g.instancia}`;
        gradesMap[key] = g.nota;
      });

      return {
        student: ins.estudiante,
        grades: gradesMap,
      };
    });

    return {
      students: matrix,
      periods,
    };
  }

  findAll() {
    return this.prisma.calificacion.findMany({
      include: {
        materia: true,
        inscripcion: {
          include: {
            estudiante: true,
            curso: true
          }
        }
      },
      orderBy: { fecha: 'desc' },
    });
  }

  // Find grades by Student (History/Trajectory)
  findByStudent(studentId: number) {
    return this.prisma.calificacion.findMany({
      where: {
        inscripcion: { estudianteId: studentId }
      },
      include: {
        materia: true,
        inscripcion: {
          include: { curso: { include: { cicloLectivo: true } } }
        }
      },
      orderBy: { inscripcion: { curso: { cicloLectivo: { anio: 'desc' } } } },
    });
  }

  async getSummary(studentId: number) {
    const grades = await this.prisma.calificacion.findMany({
      where: {
        inscripcion: { estudianteId: studentId }
      },
      include: { materia: true },
    });

    // Filtramos solo las de "CIERRE" para contar desaprobadas (nota < 6)
    const desaprobadas = grades.filter(
      (g) => g.instancia === 'CIERRE' && g.nota < 6,
    );
    const countDesaprobadas = desaprobadas.length;

    let riesgo = 'B'; // Bajo
    if (countDesaprobadas > 6) {
      riesgo = 'A'; // Alto
    } else if (countDesaprobadas >= 2) {
      riesgo = 'M'; // Medio
    }

    return {
      grades,
      countDesaprobadas,
      riesgo,
    };
  }

  findOne(id: number) {
    return this.prisma.calificacion.findUnique({
      where: { id },
      include: { inscripcion: true }
    });
  }
}
