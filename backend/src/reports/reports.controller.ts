import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
}
