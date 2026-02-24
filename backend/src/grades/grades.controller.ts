import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('matrix')
  getMatrix(
    @Query('courseId') courseId: string,
    @Query('subjectId') subjectId: string,
  ) {
    if (!courseId || !subjectId)
      throw new BadRequestException('Faltan courseId y subjectId');
    return this.gradesService.getMatrix(+courseId, +subjectId);
  }

  @Post()
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string) {
    if (studentId) {
      return this.gradesService.findByStudent(+studentId);
    }
    return this.gradesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gradesService.findOne(+id);
  }
}
