import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        // Asegurar que exista al menos un registro de configuración
        const count = await this.prisma.configuracion.count();
        if (count === 0) {
            await this.prisma.configuracion.create({
                data: {
                    id: 1,
                    nombreInstitucion: 'SGE - Soberanía Nacional',
                },
            });
        }
    }

    async getConfig() {
        return this.prisma.configuracion.findFirst({
            where: { id: 1 },
        });
    }

    async updateConfig(data: { nombreInstitucion?: string; logoBase64?: string; firmaBase64?: string; selloBase64?: string; pieDePagina?: string }) {
        return this.prisma.configuracion.update({
            where: { id: 1 },
            data,
        });
    }
}
