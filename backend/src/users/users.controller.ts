import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Roles(Rol.ADMIN, Rol.DIRECTIVO, Rol.SECRETARIO, Rol.PROSECRETARIO, Rol.JEFE_PRECEPTOR)
    @Get()
    async findAll(@Req() req) {
        const currentUserRole = req.user.rol;
        const users = await this.usersService.findAll();

        // Filtrado jerárquico
        if (currentUserRole === 'ADMIN') return users;
        if (currentUserRole === 'DIRECTIVO' || currentUserRole === 'SECRETARIO') {
            return users.filter(u => u.rol !== 'ADMIN');
        }
        if (currentUserRole === 'PROSECRETARIO') {
            const allowed = ['PROSECRETARIO', 'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR', 'PRECEPTOR'];
            return users.filter(u => allowed.includes(u.rol));
        }
        if (currentUserRole === 'JEFE_PRECEPTOR') {
            return users.filter(u => u.rol === 'PRECEPTOR');
        }

        return [];
    }

    @Roles(Rol.ADMIN, Rol.PROSECRETARIO)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(+id);
    }

    @Roles(Rol.ADMIN, Rol.DIRECTIVO, Rol.SECRETARIO, Rol.PROSECRETARIO, Rol.JEFE_PRECEPTOR)
    @Post()
    async create(@Body() data: any, @Req() req) {
        const currentUserRole = req.user.rol;
        this.validateHierarchy(currentUserRole, data.rol);

        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, 10);
            delete data.password;
        }
        return this.usersService.create(data);
    }

    @Roles(Rol.ADMIN, Rol.DIRECTIVO, Rol.SECRETARIO, Rol.PROSECRETARIO, Rol.JEFE_PRECEPTOR)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: any, @Req() req) {
        // Obtenemos el usuario existente
        const targetUser = await this.usersService.findById(+id);
        const currentUserRole = req.user.rol;

        // Validamos intento de escalar su propio rol al actualizar, o actualizar alguien superior
        if (targetUser) {
            if (data.rol) this.validateHierarchy(currentUserRole, data.rol);
            this.validateHierarchy(currentUserRole, targetUser.rol);
        }

        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, 10);
            delete data.password;
        }
        return this.usersService.update(+id, data);
    }

    private validateHierarchy(currentUserRole: string, targetRole: string) {
        if (currentUserRole === 'ADMIN') return;

        if (currentUserRole === 'DIRECTIVO' || currentUserRole === 'SECRETARIO') {
            if (targetRole === 'ADMIN') throw new ForbiddenException('No puedes jerarquizar perfiles a un nivel superior administrativo/directivo');
            return;
        }

        if (currentUserRole === 'PROSECRETARIO') {
            const allowed = ['PROSECRETARIO', 'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR', 'PRECEPTOR'];
            if (!allowed.includes(targetRole)) throw new ForbiddenException('No tienes jerarquía sobre este rol');
            return;
        }

        if (currentUserRole === 'JEFE_PRECEPTOR') {
            if (targetRole !== 'PRECEPTOR') throw new ForbiddenException('Jefes de Preceptores sólo pueden administrar Preceptores');
            return;
        }

        throw new ForbiddenException('Tu rol no tiene permisos de administración de usuarios');
    }

    @Roles(Rol.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(+id);
    }

    @Roles(Rol.ADMIN, Rol.DIRECTIVO, Rol.SECRETARIO, Rol.PROSECRETARIO, Rol.JEFE_PRECEPTOR)
    @Get(':id/assignments')
    async getAssignments(@Param('id') id: string) {
        return this.usersService.getUserAssignments(+id);
    }

    @Roles(Rol.ADMIN, Rol.DIRECTIVO, Rol.SECRETARIO, Rol.PROSECRETARIO, Rol.JEFE_PRECEPTOR)
    @Post(':id/assignments')
    async updateAssignments(@Param('id') id: string, @Body('courseIds') courseIds: number[]) {
        return this.usersService.updateUserAssignments(+id, courseIds);
    }
}
