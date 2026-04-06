import { Controller, Get, Param, Res, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('bulletin/:studentId')
  async getBulletin(
    @Param('studentId') studentId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateBulletin(+studentId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=boletin_${studentId}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('risk-report')
  async getRiskReport(@Res() res: Response) {
    const buffer = await this.reportsService.generateRiskReport();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=reporte_riesgo.pdf',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('stats/risk')
  async getRiskStats() {
    return this.reportsService.getRiskStats();
  }

  @Get('general-grades')
  async getGeneralGradesReport(
    @Query('cursoId') cursoId: string,
    @Query('cuatrimestre') cuatrimestre: string,
    @Query('instancia') instancia: string,
  ) {
    return this.reportsService.getGeneralGradesReport(+cursoId, cuatrimestre, instancia);
  }

  @Get('general-grades/excel')
  async downloadGeneralGradesExcel(
    @Query('cursoId') cursoId: string,
    @Query('cuatrimestre') cuatrimestre: string,
    @Query('instancia') instancia: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateGeneralGradesExcel(+cursoId, cuatrimestre, instancia);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=notas_generales.xlsx',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('family-report/course')
  async getCourseFamilyReport(
    @Query('cursoId') cursoId: string,
    @Query('cuatrimestre') cuatrimestre: string,
    @Query('instancia') instancia: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateFamilyReportPDF(+cursoId, cuatrimestre, instancia, 'COURSE');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=informes_familia_curso.pdf',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('family-report/student/:id')
  async getFamilyReportStudent(
    @Param('id') studentId: string,
    @Query('cursoId') cursoId: string,
    @Query('cuatrimestre') cuatrimestre: string,
    @Query('instancia') instancia: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateFamilyReportPDF(
      Number(cursoId),
      cuatrimestre,
      instancia,
      'INDIVIDUAL',
      Number(studentId),
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="informe_familia.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('calificadores/course')
  async getCalificadoresCourse(
    @Query('cursoId') cursoId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateCalificadoresPDF(
      Number(cursoId),
      'COURSE'
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="calificadores_curso.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('calificadores/student/:id')
  async getCalificadoresStudent(
    @Param('id') studentId: string,
    @Query('cursoId') cursoId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateCalificadoresPDF(
      Number(cursoId),
      'INDIVIDUAL',
      Number(studentId),
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="calificador_individual.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('boletines/course')
  async getBoletinesCourse(
    @Query('cursoId') cursoId: string,
    @Query('cicloId') cicloId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateBoletinesPDF(
      Number(cursoId),
      Number(cicloId),
      'COURSE'
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="boletines_curso.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('boletines/student/:id')
  async getBoletinesStudent(
    @Param('id') studentId: string,
    @Query('cursoId') cursoId: string,
    @Query('cicloId') cicloId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateBoletinesPDF(
      Number(cursoId),
      Number(cicloId),
      'INDIVIDUAL',
      Number(studentId),
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="boletin_individual.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
