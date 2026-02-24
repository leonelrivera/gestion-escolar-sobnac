import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { CreateBulkInscriptionsDto } from './dto/create-bulk-inscriptions.dto';

@Injectable()
export class InscriptionsService {
    constructor(private prisma: PrismaService) { }

    async create(createInscriptionDto: CreateInscriptionDto) {
        const { estudianteId, cursoId } = createInscriptionDto;

        // Obtener el curso destino para saber su ciclo lectivo
        const cursoDestino = await this.prisma.curso.findUnique({
            where: { id: cursoId },
            include: { cicloLectivo: true }
        });

        if (!cursoDestino) throw new BadRequestException('El curso destino no existe.');

        // Verificar si existe inscripción en el MISMO ciclo lectivo
        const inscripcionExistente = await this.prisma.inscripcion.findFirst({
            where: {
                estudianteId,
                curso: { cicloLectivoId: cursoDestino.cicloLectivoId }
            }
        });

        if (inscripcionExistente) {
            // Si ya está en este curso, error
            if (inscripcionExistente.cursoId === cursoId) {
                throw new BadRequestException('El estudiante ya está inscripto en este curso.');
            }
            // Si está en otro curso del mismo ciclo -> TRASLADO (Update)
            return await this.prisma.inscripcion.update({
                where: { id: inscripcionExistente.id },
                data: { cursoId }
            });
        }

        // Si no existe inscripción en el ciclo -> CREATE
        return await this.prisma.inscripcion.create({
            data: {
                estudianteId,
                cursoId,
                condicion: 'REGULAR',
                fechaInscripcion: new Date(),
            },
        });
    }

    async createBulk(createBulkInscriptionsDto: CreateBulkInscriptionsDto) {
        const { estudianteIds, cursoId } = createBulkInscriptionsDto;

        // Obtener el curso destino (fuera del loop para optimizar)
        const cursoDestino = await this.prisma.curso.findUnique({
            where: { id: cursoId },
            include: { cicloLectivo: true }
        });

        if (!cursoDestino) throw new BadRequestException('El curso destino no existe.');

        return this.prisma.$transaction(async (tx) => {
            const results: any[] = [];
            for (const estudianteId of estudianteIds) {
                // Verificar inscripción existente en el mismo ciclo
                const existing = await tx.inscripcion.findFirst({
                    where: {
                        estudianteId,
                        curso: { cicloLectivoId: cursoDestino.cicloLectivoId }
                    },
                });

                if (existing) {
                    // Si es diferente curso -> TRASLADO
                    if (existing.cursoId !== cursoId) {
                        const updated = await tx.inscripcion.update({
                            where: { id: existing.id },
                            data: { cursoId }
                        });
                        results.push(updated);
                    }
                    // Si es el mismo curso, no hacemos nada (idempotente)
                } else {
                    // No existe en el ciclo -> CREATE
                    const ins = await tx.inscripcion.create({
                        data: {
                            estudianteId,
                            cursoId,
                            condicion: 'REGULAR',
                            fechaInscripcion: new Date(),
                        },
                    });
                    results.push(ins);
                }
            }
            return results;
        });
    }

    findAll() {
        return this.prisma.inscripcion.findMany({
            include: { estudiante: true, curso: true }
        });
    }
}
