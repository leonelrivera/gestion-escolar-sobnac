import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('configuracion')
export class ConfiguracionController {
    constructor(private configuracionService: ConfiguracionService) { }

    @Get()
    getConfig() {
        return this.configuracionService.getConfig();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN', 'PROSECRETARIO')
    @Patch()
    updateConfig(@Body() body: { nombreInstitucion?: string; logoBase64?: string; pieDePagina?: string }) {
        return this.configuracionService.updateConfig(body);
    }
}
