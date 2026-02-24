import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) { }

  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Post('bulk')
  createBulk(@Body() attendanceData: CreateAttendanceDto[]) {
    return this.attendanceService.createBulk(attendanceData);
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('cursoId') cursoId?: string,
    @Query('fecha') fecha?: string,
  ) {
    if (studentId) {
      return this.attendanceService.findByStudent(+studentId);
    }
    return this.attendanceService.findAll({
      cursoId: cursoId ? +cursoId : undefined,
      fecha
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(+id);
  }
}
