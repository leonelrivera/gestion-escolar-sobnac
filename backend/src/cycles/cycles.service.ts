import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';

@Injectable()
export class CyclesService {
  constructor(private prisma: PrismaService) { }

  async create(createCycleDto: CreateCycleDto) {
    // Si este nuevo ciclo es "enCurso", desactivar los otros
    if (createCycleDto.enCurso) {
      await this.prisma.cicloLectivo.updateMany({
        where: { enCurso: true },
        data: { enCurso: false },
      });
    }

    return this.prisma.cicloLectivo.create({
      data: {
        ...createCycleDto,
        fechaInicio: new Date(createCycleDto.fechaInicio),
        fechaFin: new Date(createCycleDto.fechaFin),
      },
    });
  }

  findAll() {
    return this.prisma.cicloLectivo.findMany({
      orderBy: { anio: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.cicloLectivo.findUnique({ where: { id } });
  }

  async update(id: number, updateCycleDto: UpdateCycleDto) {
    // Si se marca como enCurso, desactivar otros
    if (updateCycleDto.enCurso) {
      await this.prisma.cicloLectivo.updateMany({
        where: { id: { not: id }, enCurso: true },
        data: { enCurso: false },
      });
    }

    const data: any = { ...updateCycleDto };
    if (updateCycleDto.fechaInicio) data.fechaInicio = new Date(updateCycleDto.fechaInicio);
    if (updateCycleDto.fechaFin) data.fechaFin = new Date(updateCycleDto.fechaFin);

    return this.prisma.cicloLectivo.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    // Verificar si tiene cursos asociados antes de borrar
    const count = await this.prisma.curso.count({ where: { cicloLectivoId: id } });
    if (count > 0) {
      throw new Error('No se puede eliminar un ciclo con cursos asociados.');
    }
    return this.prisma.cicloLectivo.delete({ where: { id } });
  }

  // Parametros de Ciclo (Apertura/Cierre de Notas)
  async toggleInstancia(data: {
    cicloLectivoId: number;
    instancia: any;
    cuatrimestre: number;
    cerrado: boolean;
    usuarioId: number;
  }) {
    return this.prisma.parametrosCiclo.upsert({
      where: {
        cicloLectivoId_instancia_cuatrimestre: {
          cicloLectivoId: data.cicloLectivoId,
          instancia: data.instancia,
          cuatrimestre: data.cuatrimestre,
        },
      },
      update: {
        cerrado: data.cerrado,
        fechaCierre: data.cerrado ? new Date() : null,
        usuarioCierreId: data.cerrado ? data.usuarioId : null,
      },
      create: {
        cicloLectivoId: data.cicloLectivoId,
        instancia: data.instancia,
        cuatrimestre: data.cuatrimestre,
        cerrado: data.cerrado,
        fechaCierre: data.cerrado ? new Date() : null,
        usuarioCierreId: data.cerrado ? data.usuarioId : null,
      },
    });
  }

  async getParametros(cicloLectivoId: number) {
    return this.prisma.parametrosCiclo.findMany({
      where: { cicloLectivoId },
    });
  }

  async isCerrado(
    cicloLectivoId: number,
    instancia: any,
    cuatrimestre: number,
  ) {
    const params = await this.prisma.parametrosCiclo.findUnique({
      where: {
        cicloLectivoId_instancia_cuatrimestre: {
          cicloLectivoId,
          instancia,
          cuatrimestre,
        },
      },
    });
    return params?.cerrado || false;
  }
}
