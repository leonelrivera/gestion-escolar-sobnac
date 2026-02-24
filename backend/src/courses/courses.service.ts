import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    try {
      return await this.prisma.curso.create({
        data: createCourseDto,
        include: { cicloLectivo: true, orientacion: true, preceptor: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un curso con esa combinación de ciclo, año, división y turno.',
        );
      }
      throw error;
    }
  }

  findAll(cicloLectivoId?: number) {
    return this.prisma.curso.findMany({
      where: cicloLectivoId ? { cicloLectivoId } : undefined,
      include: {
        cicloLectivo: true,
        orientacion: true,
        preceptor: true,
        inscripciones: { select: { id: true } },
      },
      orderBy: [
        { cicloLectivo: { anio: 'desc' } },
        { anioCurso: 'asc' },
        { division: 'asc' },
      ],
    });
  }

  async findOne(id: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: {
        cicloLectivo: true,
        orientacion: true,
        preceptor: true,
        inscripciones: {
          include: { estudiante: true },
        },
      },
    });
    if (!curso) throw new NotFoundException(`Curso #${id} no encontrado`);
    return curso;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    try {
      return await this.prisma.curso.update({
        where: { id },
        data: updateCourseDto,
        include: { cicloLectivo: true, orientacion: true, preceptor: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Curso #${id} no encontrado`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un curso con esa combinación de ciclo, año, división y turno.',
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.curso.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Curso #${id} no encontrado`);
      }
      if (error.code === 'P2003') {
        throw new ConflictException(
          'No se puede eliminar el curso porque tiene inscripciones asociadas.',
        );
      }
      throw error;
    }
  }
}
