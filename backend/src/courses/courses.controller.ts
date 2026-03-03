import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Rol } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  @Roles(Rol.ADMIN, Rol.PROSECRETARIO, Rol.DEP_ESTUDIANTES, Rol.JEFE_PRECEPTOR)
  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll(@Query('cicloLectivoId') cicloLectivoId?: string, @Req() req?: any) {
    return this.coursesService.findAll(
      cicloLectivoId ? +cicloLectivoId : undefined,
      req.user
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
  }

  @Roles(Rol.ADMIN, Rol.PROSECRETARIO, Rol.DEP_ESTUDIANTES, Rol.JEFE_PRECEPTOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(+id, updateCourseDto);
  }

  @Roles(Rol.ADMIN, Rol.PROSECRETARIO, Rol.DEP_ESTUDIANTES, Rol.JEFE_PRECEPTOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }
}
