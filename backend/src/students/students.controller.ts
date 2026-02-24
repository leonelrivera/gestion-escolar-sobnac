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

@UseGuards(AuthGuard('jwt'))
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) { }

  @Post()
  create(@Body() createStudentDto: CreateStudentDto, @Req() req: any) {
    return this.studentsService.create(createStudentDto, req.user.userId);
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
  ) {
    return this.studentsService.findAll({
      search,
      cicloLectivo,
      curso,
      division,
      turno,
      condicion,
      sinCurso: sinCurso === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Req() req: any,
  ) {
    return this.studentsService.update(+id, updateStudentDto, req.user.userId);
  }
}
