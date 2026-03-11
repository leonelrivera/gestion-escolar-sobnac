import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { InscriptionsService } from './inscriptions.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { CreateBulkInscriptionsDto } from './dto/create-bulk-inscriptions.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Rol } from '@prisma/client';

@Controller('inscriptions')
export class InscriptionsController {
    constructor(private readonly inscriptionsService: InscriptionsService) { }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Rol.ADMIN, Rol.PROSECRETARIO, Rol.DEP_ESTUDIANTES)
    @Post()
    create(@Body() createInscriptionDto: CreateInscriptionDto) {
        return this.inscriptionsService.create(createInscriptionDto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Rol.ADMIN, Rol.PROSECRETARIO, Rol.DEP_ESTUDIANTES)
    @Post('bulk')
    createBulk(@Body() createBulkInscriptionsDto: CreateBulkInscriptionsDto) {
        return this.inscriptionsService.createBulk(createBulkInscriptionsDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll() {
        return this.inscriptionsService.findAll();
    }
}
