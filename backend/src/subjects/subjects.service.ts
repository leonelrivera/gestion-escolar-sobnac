import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) { }

  create(createSubjectDto: CreateSubjectDto) {
    return this.prisma.materia.create({
      data: createSubjectDto,
    });
  }

  findAll(orientacion?: string) {
    return this.prisma.materia.findMany({
      where: orientacion ? {
        OR: [
          { orientacionFiltro: orientacion },
          { orientacionFiltro: 'E.S.O' },
          { orientacionFiltro: null }
        ]
      } : undefined,
      orderBy: [
        { anioCurso: 'asc' },
        { nombre: 'asc' }
      ]
    });
  }

  findOne(id: number) {
    return this.prisma.materia.findUnique({ where: { id } });
  }

  update(id: number, updateSubjectDto: UpdateSubjectDto) {
    return this.prisma.materia.update({
      where: { id },
      data: updateSubjectDto,
    });
  }

  remove(id: number) {
    return this.prisma.materia.delete({ where: { id } });
  }
}
