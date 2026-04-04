import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const PDFDocument = require('pdfkit-table');
const ExcelJS = require('exceljs');

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

  async getRiskStats() {
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

    const stats = {
      total: students.length,
      bajo: 0,
      medio: 0,
      alto: 0,
      sinRiesgo: 0,
      studentsRisk: [] as any[]
    };

    students.forEach((s) => {
      const activeIns = s.inscripciones[0];
      if (!activeIns) {
        stats.sinRiesgo++;
        return;
      }

      const desaprobadas = activeIns.calificaciones.filter((c) => c.nota < 6).length;
      let riesgo = 'Bajo';
      if (desaprobadas === 0) {
        riesgo = 'Sin Riesgo';
        stats.sinRiesgo++;
      } else if (desaprobadas > 6) {
        riesgo = 'Alto';
        stats.alto++;
      } else if (desaprobadas >= 2) {
        riesgo = 'Medio';
        stats.medio++;
      } else {
        stats.bajo++;
      }

      if (riesgo !== 'Sin Riesgo') {
        stats.studentsRisk.push({
          id: s.id,
          nombre: `${s.apellido.toUpperCase()}, ${s.nombre}`,
          curso: `${activeIns.curso.anioCurso || ''} ${activeIns.curso.division || ''}`,
          desaprobadas,
          riesgo
        });
      }
    });

    return stats;
  }

  async getGeneralGradesReport(cursoId: number, cuatrimestreStr: string, instanciaStr: string) {
    let currentCuatrimestre = 1;
    let currentInstancia = 'INFORME_1';

    if (cuatrimestreStr === '1') currentCuatrimestre = 1;
    else if (cuatrimestreStr === '2') currentCuatrimestre = 2;

    if (cuatrimestreStr === 'DICIEMBRE') {
      currentInstancia = 'COMPLEMENTARIO_DIC';
      currentCuatrimestre = 2;
    } else if (cuatrimestreStr === 'FEBRERO') {
      currentInstancia = 'COMPLEMENTARIO_FEB';
      currentCuatrimestre = 2;
    } else if (cuatrimestreStr === 'C.FINAL') {
      currentInstancia = 'FINAL';
      currentCuatrimestre = 2;
    } else {
      currentInstancia = instanciaStr;
    }

    const course = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      include: {
        orientacion: true,
        inscripciones: {
          include: {
            estudiante: true,
            calificaciones: {
              where: {
                cuatrimestre: currentCuatrimestre,
                instancia: currentInstancia as any,
              },
              include: { materia: true },
            },
          },
        },
      },
    });

    if (!course) throw new Error('Curso no encontrado');

    const materiasCondition: any = { anioCurso: course.anioCurso };
    if (course.orientacion) {
      materiasCondition.OR = [
        { orientacionFiltro: null },
        { orientacionFiltro: '' },
        { orientacionFiltro: course.orientacion.nombre },
      ];
    }

    const materiasList = await this.prisma.materia.findMany({
      where: materiasCondition,
      orderBy: { id: 'asc' },
    });

    const materiasNamesSet = new Set(materiasList.map((m) => m.nombre));

    course.inscripciones.forEach((ins) => {
      ins.calificaciones.forEach((g) => {
        materiasNamesSet.add(g.materia.nombre);
      });
    });

    const materiasNames = Array.from(materiasNamesSet);

    const alumnos = course.inscripciones.map((ins) => {
      const student = ins.estudiante;
      const grades = ins.calificaciones;

      let desaprobadasCount = 0;
      const gradesByMateria: Record<string, number | null> = {};

      materiasNames.forEach((m) => {
        gradesByMateria[m] = null;
      });

      grades.forEach((g) => {
        gradesByMateria[g.materia.nombre] = g.nota;
        if (g.nota < 6) desaprobadasCount++;
      });

      let riesgo = 'B';
      if (desaprobadasCount > 6) riesgo = 'A';
      else if (desaprobadasCount >= 5) riesgo = 'M';

      return {
        id: student.id,
        dni: student.dni,
        apellido: student.apellido,
        nombre: student.nombre,
        genero: student.genero === 'Masculino' ? 'V' : (student.genero === 'Femenino' ? 'M' : 'O'),
        materias: gradesByMateria,
        desaprobadas: desaprobadasCount,
        riesgo: desaprobadasCount >= 1 ? riesgo : '',
      };
    });

    alumnos.sort((a, b) => {
      const nameA = `${a.apellido} ${a.nombre}`.toLowerCase();
      const nameB = `${b.apellido} ${b.nombre}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return {
      curso: `${course.anioCurso} ${course.division}`,
      materias: materiasNames,
      alumnos: alumnos,
    };
  }

  async generateGeneralGradesExcel(cursoId: number, cuatrimestreStr: string, instanciaStr: string): Promise<Buffer> {
    const reportData = await this.getGeneralGradesReport(cursoId, cuatrimestreStr, instanciaStr);
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Notas Generales');

    // Title
    sheet.addRow([`Reporte Notas Generales - ${reportData.curso}`]);
    sheet.addRow([`Cuatrimestre: ${cuatrimestreStr} | Instancia: ${instanciaStr}`]);
    sheet.addRow([]);

    const baseHeaders = ['Nº', 'DNI', 'Sexo', 'Apellido y Nombre'];
    const headers = [...baseHeaders, ...reportData.materias, 'C. Desapr', 'R.P.'];

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    reportData.alumnos.forEach((a, idx) => {
      const rowData: any[] = [
        idx + 1,
        a.dni,
        a.genero,
        `${a.apellido}, ${a.nombre}`,
      ];

      reportData.materias.forEach(m => {
        rowData.push(a.materias[m] !== null ? a.materias[m] : '');
      });

      rowData.push(a.desaprobadas);
      rowData.push(a.riesgo);

      sheet.addRow(rowData);
    });

    sheet.columns.forEach((col: any) => { col.width = 12; });
    sheet.getColumn(4).width = 30; // Nombre

    return await workbook.xlsx.writeBuffer() as Buffer;
  }
}
