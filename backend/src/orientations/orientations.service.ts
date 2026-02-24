import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrientationDto } from './dto/create-orientation.dto';
import { UpdateOrientationDto } from './dto/update-orientation.dto';

@Injectable()
export class OrientationsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.orientacion.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { cursos: true } } },
    });
  }

  async create(dto: CreateOrientationDto) {
    try {
      return await this.prisma.orientacion.create({ data: dto });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe una orientación con el nombre "${dto.nombre}".`,
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateOrientationDto) {
    try {
      return await this.prisma.orientacion.update({
        where: { id },
        data: dto,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Orientación #${id} no encontrada`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe una orientación con el nombre "${dto.nombre}".`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.orientacion.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Orientación #${id} no encontrada`);
      }
      if (error.code === 'P2003') {
        throw new ConflictException(
          'No se puede eliminar la orientación porque tiene cursos asociados.',
        );
      }
      throw error;
    }
  }
}
