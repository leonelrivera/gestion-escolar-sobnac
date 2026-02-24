import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { InscriptionsService } from './inscriptions.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { CreateBulkInscriptionsDto } from './dto/create-bulk-inscriptions.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('inscriptions')
export class InscriptionsController {
    constructor(private readonly inscriptionsService: InscriptionsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() createInscriptionDto: CreateInscriptionDto) {
        return this.inscriptionsService.create(createInscriptionDto);
    }

    @UseGuards(AuthGuard('jwt'))
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
