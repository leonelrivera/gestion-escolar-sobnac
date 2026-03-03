import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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

    @Roles(Rol.ADMIN, Rol.PROSECRETARIO)
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Roles(Rol.ADMIN, Rol.PROSECRETARIO)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(+id);
    }

    @Roles(Rol.ADMIN, Rol.PROSECRETARIO)
    @Post()
    async create(@Body() data: any) {
        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, 10);
            delete data.password;
        }
        return this.usersService.create(data);
    }

    @Roles(Rol.ADMIN, Rol.PROSECRETARIO)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, 10);
            delete data.password;
        }
        return this.usersService.update(+id, data);
    }

    @Roles(Rol.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(+id);
    }
}
