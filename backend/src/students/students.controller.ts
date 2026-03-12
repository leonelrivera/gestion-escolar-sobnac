import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
  Patch,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Rol } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) { }

  @Roles(Rol.ADMIN, Rol.PROSECRETARIO, Rol.DEP_ESTUDIANTES, Rol.JEFE_PRECEPTOR)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto, @Req() req: any) {
    return this.studentsService.create(createStudentDto, req.user.userId);
  }

  @Roles(Rol.ADMIN, Rol.PROSECRETARIO, Rol.DEP_ESTUDIANTES, Rol.JEFE_PRECEPTOR)
  @Post('bulk')
  createBulk(@Body() createStudentDtos: CreateStudentDto[], @Req() req: any) {
    return this.studentsService.createBulk(createStudentDtos, req.user.userId);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('cicloLectivo') cicloLectivo?: number,
    @Query('curso') curso?: string,
    @Query('division') division?: string,
    @Query('turno') turno?: string,
    @Query('condicion') condicion?: string,
    @Query('sinCurso') sinCurso?: string, // received as string 'true'/'false'
    @Req() req?: any,
  ) {
    return this.studentsService.findAll({
      search,
      cicloLectivo,
      curso,
      division,
      turno,
      condicion,
      sinCurso: sinCurso === 'true',
    }, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(+id);
  }

  @Roles(Rol.ADMIN, Rol.PROSECRETARIO, Rol.DEP_ESTUDIANTES, Rol.JEFE_PRECEPTOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Req() req: any,
  ) {
    return this.studentsService.update(+id, updateStudentDto, req.user.userId);
  }
}
