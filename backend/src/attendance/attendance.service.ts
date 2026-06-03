import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) { }

  create(createAttendanceDto: CreateAttendanceDto) {
    return this.prisma.asistencia.create({
      data: {
        ...createAttendanceDto,
        fecha: new Date(createAttendanceDto.fecha),
      },
    });
  }

  async createBulk(attendanceData: CreateAttendanceDto[]) {
    // Transaction to ensure atomicity
    return this.prisma.$transaction(
      async (tx) => {
        const results: any[] = [];
        for (const data of attendanceData) {
          const dateStart = new Date(data.fecha);
          dateStart.setHours(0, 0, 0, 0);
          const dateEnd = new Date(data.fecha);
          dateEnd.setHours(23, 59, 59, 999);

          const existing = await tx.asistencia.findFirst({
            where: {
              inscripcionId: data.inscripcionId,
              fecha: {
                gte: dateStart,
                lte: dateEnd
              }
            }
          });

          if (existing) {
            results.push(await tx.asistencia.update({
              where: { id: existing.id },
              data: { 
                presente: data.presente,
                justificado: data.justificado !== undefined ? data.justificado : existing.justificado,
                observaciones: data.observaciones !== undefined ? data.observaciones : existing.observaciones
              }
            }));
          } else {
            results.push(await tx.asistencia.create({
              data: {
                inscripcionId: data.inscripcionId,
                fecha: new Date(data.fecha),
                presente: data.presente,
                justificado: data.justificado || false,
                observaciones: data.observaciones || null
              }
            }));
          }
        }
        return results;
      }
    );
  }

  findAll(filters?: { cursoId?: number; fecha?: string; fechaDesde?: string; fechaHasta?: string }) {
    const where: any = {};
    if (filters?.fecha) {
      const start = new Date(filters.fecha);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.fecha);
      end.setHours(23, 59, 59, 999);
      where.fecha = { gte: start, lte: end };
    } else if (filters?.fechaDesde || filters?.fechaHasta) {
      where.fecha = {};
      if (filters.fechaDesde) {
        const start = new Date(filters.fechaDesde);
        start.setHours(0, 0, 0, 0);
        where.fecha.gte = start;
      }
      if (filters.fechaHasta) {
        const end = new Date(filters.fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }
    if (filters?.cursoId) {
      where.inscripcion = { cursoId: filters.cursoId };
    }

    return this.prisma.asistencia.findMany({
      where,
      include: {
        inscripcion: {
          include: { estudiante: true }
        }
      },
      orderBy: { fecha: 'desc' },
    });
  }

  findByStudent(studentId: number) {
    return this.prisma.asistencia.findMany({
      where: {
        inscripcion: { estudianteId: studentId }
      },
      include: {
        inscripcion: {
          include: { curso: { include: { cicloLectivo: true } } }
        }
      },
      orderBy: { fecha: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.asistencia.findUnique({
      where: { id },
      include: { inscripcion: true }
    });
  }
}
