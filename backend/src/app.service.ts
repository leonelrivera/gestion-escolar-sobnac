import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'API Gestión Escolar Funcionando';
  }

  async getDashboardStats() {
    const activeCycle = await this.prisma.cicloLectivo.findFirst({
      where: { enCurso: true },
    });

    let cicloAnio = 'Ninguno';
    let estudiantesActivos = 0;

    if (activeCycle) {
      cicloAnio = activeCycle.anio.toString();

      const inscripciones = await this.prisma.inscripcion.findMany({
        where: { curso: { cicloLectivoId: activeCycle.id } },
        select: { estudianteId: true },
        distinct: ['estudianteId']
      });
      estudiantesActivos = inscripciones.length;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const inasistenciasHoy = await this.prisma.asistencia.count({
      where: {
        fecha: {
          gte: startOfToday,
          lte: endOfToday,
        },
        presente: false,
      },
    });

    return {
      cicloLectivo: cicloAnio,
      estudiantesActivos,
      inasistenciasHoy,
    };
  }
}
