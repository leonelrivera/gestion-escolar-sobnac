import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const PDFDocument = require('pdfkit-table');

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) { }

  async generateBulletin(studentId: number): Promise<Buffer> {
    const student = await this.prisma.estudiante.findUnique({
      where: { id: studentId },
      include: {
        inscripciones: {
          where: { curso: { cicloLectivo: { enCurso: true } } },
          include: {
            curso: { include: { cicloLectivo: true } },
            calificaciones: { include: { materia: true } },
            asistencias: true,
          },
        },
      },
    });

    if (!student) throw new Error('Estudiante no encontrado');
    const activeInscription = student.inscripciones[0];
    if (!activeInscription) throw new Error('Estudiante no inscrito en el ciclo activo');

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(16).text('BOLETÍN DE CALIFICACIONES', { align: 'center' });
      doc
        .fontSize(12)
        .text(
          `Ciclo Lectivo: ${activeInscription.curso.cicloLectivo.anio}`,
          { align: 'center' },
        );
      doc.moveDown();

      // Student Info
      doc
        .fontSize(10)
        .text(
          `Estudiante: ${student.apellido.toUpperCase()}, ${student.nombre}`,
        );
      doc.text(`DNI: ${student.dni}`);
      doc.text(
        `Curso: ${activeInscription.curso.anioCurso} ${activeInscription.curso.division}`,
      );
      doc.moveDown();

      // Grades Table
      const table: any = {
        title: 'Calificaciones por Materia',
        headers: ['Materia', '1er Inf.', '2do Inf.', 'PFA', 'Final'],
        rows: [] as any[][],
      };

      // Group grades by subject
      const subjects: any = {};
      activeInscription.calificaciones.forEach((c) => {
        if (!subjects[c.materia.nombre]) {
          subjects[c.materia.nombre] = {
            informe1: '-',
            informe2: '-',
            pfa: '-',
            cierre: '-',
          };
        }
        if (c.instancia === 'INFORME_1')
          subjects[c.materia.nombre].informe1 = c.nota;
        if (c.instancia === 'INFORME_2')
          subjects[c.materia.nombre].informe2 = c.nota;
        if (c.instancia === 'PFA') subjects[c.materia.nombre].pfa = c.nota;
        if (c.instancia === 'CIERRE')
          subjects[c.materia.nombre].cierre = c.nota;
      });

      Object.entries(subjects).forEach(([name, grades]: [string, any]) => {
        table.rows.push([
          name,
          grades.informe1,
          grades.informe2,
          grades.pfa,
          grades.cierre,
        ]);
      });

      doc.table(table, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: (
          row: any,
          indexColumn: number,
          indexRow: number,
          rectRow: any,
          rectCell: any,
        ) => doc.font('Helvetica').fontSize(10),
      });

      doc.moveDown();

      // Attendance
      const faltas = activeInscription.asistencias.filter((a) => !a.presente).length;
      doc.fontSize(12).text('Inasistencias', { underline: true });
      doc.fontSize(10).text(`Total de inasistencias: ${faltas}`);

      doc.end();
    });
  }

  async generateRiskReport(): Promise<Buffer> {
    const students = await this.prisma.estudiante.findMany({
      include: {
        inscripciones: {
          where: { curso: { cicloLectivo: { enCurso: true } } },
          include: {
            curso: true,
            calificaciones: {
              where: { instancia: 'CIERRE' },
            },
          },
        },
      },
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc
        .fontSize(16)
        .text('REPORTE DE RIESGO PEDAGÓGICO', { align: 'center' });
      doc.moveDown();

      const table: any = {
        title: 'Listado de Estudiantes con Riesgo',
        headers: ['Estudiante', 'Curso', 'Desaprobadas', 'Riesgo'],
        rows: [] as any[][],
      };

      students.forEach((s) => {
        const activeIns = s.inscripciones[0];
        if (!activeIns) return; // Skip students not in current cycle

        const desaprobadas = activeIns.calificaciones.filter((c) => c.nota < 6).length;
        let riesgo = 'Bajo (B)';
        if (desaprobadas > 6) riesgo = 'Alto (A)';
        else if (desaprobadas >= 2) riesgo = 'Medio (M)';

        table.rows.push([
          `${s.apellido.toUpperCase()}, ${s.nombre}`,
          `${activeIns.curso.anioCurso || ''} ${activeIns.curso.division || ''}`,
          desaprobadas.toString(),
          riesgo,
        ]);
      });

      doc.table(table, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: (
          row: any,
          indexColumn: number,
          indexRow: number,
          rectRow: any,
          rectCell: any,
        ) => {
          doc.font('Helvetica').fontSize(10);
          if (row && row[3] && row[3].startsWith('Alto')) doc.fillColor('red');
          else if (row && row[3] && row[3].startsWith('Medio'))
            doc.fillColor('orange');
          else doc.fillColor('black');
        },
      });

      doc.end();
    });
  }
}
