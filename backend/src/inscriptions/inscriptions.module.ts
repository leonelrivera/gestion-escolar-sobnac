import { Module } from '@nestjs/common';
import { InscriptionsService } from './inscriptions.service';
import { InscriptionsController } from './inscriptions.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [InscriptionsController],
    providers: [InscriptionsService, PrismaService],
})
export class InscriptionsModule { }
