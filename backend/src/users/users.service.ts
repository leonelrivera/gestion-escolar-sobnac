import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Usuario } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findOne(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({
      orderBy: { nombreCompleto: 'asc' },
    });
  }

  async create(data: any): Promise<Usuario> {
    return this.prisma.usuario.create({
      data,
    });
  }

  async update(id: number, data: any): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<Usuario> {
    return this.prisma.usuario.delete({
      where: { id },
    });
  }

  async getUserAssignments(userId: number) {
    const asignaciones = await this.prisma.asignacion.findMany({
      where: { usuarioId: userId },
      select: { cursoId: true }
    });
    return asignaciones.map(a => a.cursoId);
  }

  async updateUserAssignments(userId: number, courseIds: number[]) {
    return this.prisma.$transaction(async (tx) => {
      // Eliminar asignaciones anteriores
      await tx.asignacion.deleteMany({
        where: { usuarioId: userId }
      });

      // Crear nuevas asignaciones
      if (courseIds.length > 0) {
        await tx.asignacion.createMany({
          data: courseIds.map(cursoId => ({
            usuarioId: userId,
            cursoId
          }))
        });
      }

      return { count: courseIds.length };
    });
  }
}
