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

    let mappedAnio = course.anioCurso;
    if (mappedAnio === '1') mappedAnio = '1ro';
    if (mappedAnio === '2') mappedAnio = '2do';
    if (mappedAnio === '3') mappedAnio = '3ro';
    if (mappedAnio === '4') mappedAnio = '4to';
    if (mappedAnio === '5') mappedAnio = '5to';
    if (mappedAnio === '6') mappedAnio = '6to';
    if (mappedAnio === '7') mappedAnio = '7mo';

    const materiasCondition: any = { anioCurso: mappedAnio };
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

    const materiasNames = materiasList.map((m) => m.nombre);
    const acceptedMateriaIds = new Set(materiasList.map((m) => m.id));

    const alumnos = course.inscripciones.map((ins) => {
      const student = ins.estudiante;
      const grades = ins.calificaciones;

      let desaprobadasCount = 0;
      const gradesByMateria: Record<string, number | null> = {};

      materiasNames.forEach((m) => {
        gradesByMateria[m] = null;
      });

      grades.forEach((g) => {
        if (!acceptedMateriaIds.has(g.materiaId)) return; 
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

  async generateFamilyReportPDF(cursoId: number, cuatrimestreStr: string, instanciaStr: string, type: 'COURSE' | 'INDIVIDUAL', studentId?: number): Promise<Buffer> {
    const config = await this.prisma.configuracion.findFirst({ where: { id: 1 } });
    
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
          where: studentId ? { estudianteId: studentId } : undefined,
          include: {
            estudiante: true,
            calificaciones: {
              where: { cuatrimestre: currentCuatrimestre }, 
              include: { materia: true },
            },
          },
        },
      },
    });

    if (!course) throw new Error('Curso no encontrado');

    let mappedAnio = course.anioCurso;
    if (mappedAnio === '1') mappedAnio = '1ro';
    if (mappedAnio === '2') mappedAnio = '2do';
    if (mappedAnio === '3') mappedAnio = '3ro';
    if (mappedAnio === '4') mappedAnio = '4to';
    if (mappedAnio === '5') mappedAnio = '5to';
    if (mappedAnio === '6') mappedAnio = '6to';
    if (mappedAnio === '7') mappedAnio = '7mo';

    const materiasCondition: any = { anioCurso: mappedAnio };
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
    
    const materiasNames = materiasList.map((m) => m.nombre);
    const acceptedMateriaIds = new Set(materiasList.map((m) => m.id));
    
    const alumnos = course.inscripciones.map(ins => {
        const student = ins.estudiante;
        const gradesByMateria: any = {};
        
        materiasNames.forEach(m => gradesByMateria[m] = { inf: '-', pfa: '-', cierre: '-' });
        
        ins.calificaciones.forEach(g => {
            if (!acceptedMateriaIds.has(g.materiaId)) return;
            const m = g.materia.nombre;
            
            if (g.instancia === currentInstancia) gradesByMateria[m].inf = g.nota;
            if (g.instancia === 'PFA') gradesByMateria[m].pfa = g.nota;
            if (g.instancia === 'CIERRE') gradesByMateria[m].cierre = g.nota;
        });
        
        return {
            id: student.id,
            nombreCompleto: `${student.apellido.toUpperCase()}, ${student.nombre}`,
            materias: gradesByMateria
        };
    });

    alumnos.sort((a,b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ 
        margin: 0, 
        size: type === 'COURSE' ? 'A4' : [595.28, 420] 
    }); 

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      let drawSlip = (alumno: any, xOffset: number, yOffset: number) => {
          const width = 500;
          const left = xOffset + 47.64; // Center horizontally on A4 (595.28 / 2 = 297, minus 250 = 47.64)
          let currentY = yOffset + 20;
          const rowHeight = 15;
          
          doc.lineWidth(1);
          doc.rect(left, currentY, width, 50).stroke(); // Header box
          
          // Row 1: Institucion
          doc.font('Helvetica-Bold').fontSize(12).text(config?.nombreInstitucion || 'SGE', left, currentY + 5, { width, align: 'center' });
          currentY += 20;
          doc.moveTo(left, currentY).lineTo(left+width, currentY).stroke();

          // Row 2
          doc.font('Helvetica-Bold').fontSize(9);
          doc.text(`CURSO: ${course.anioCurso} ${course.division}`, left + 5, currentY + 3);
          doc.text(`CALIFICACIÓN`, left + 150, currentY + 3);
          doc.text(instanciaStr.replace('_', ' '), left + 250, currentY + 3);
          doc.text(`${cuatrimestreStr}º CUATRIMESTRE`, left + 350, currentY + 3);

          currentY += 15;
          doc.moveTo(left, currentY).lineTo(left+width, currentY).stroke();

          // Row 3
          doc.font('Helvetica-Bold').fontSize(9);
          doc.text(`NOMBRE Y APELLIDO:  ${alumno.nombreCompleto}`, left + 5, currentY + 3);

          currentY += 15;
          doc.lineWidth(1.5).moveTo(left, currentY).lineTo(left+width, currentY).stroke();
          doc.lineWidth(1);
          
          const colX = [left, left + 200, left + 260, left + 320, left + 380, left + width];

          doc.font('Helvetica-Bold').fontSize(8);
          doc.text('ESPACIO CURRICULAR', colX[0] + 5, currentY + 3);
          let sufijo = cuatrimestreStr === '1' ? '1º' : '2º';
          doc.text(`${sufijo} INF.`, colX[1], currentY + 3, { width: 60, align: 'center'});
          doc.text('P.F.A', colX[2], currentY + 3, { width: 60, align: 'center'});
          doc.text('Cal. Cierre', colX[3], currentY + 3, { width: 60, align: 'center'});
          doc.text('FIRMA / SELLO DIRECTIVO', colX[4] + 5, currentY + 3, { width: 110, align: 'center'});

          currentY += rowHeight;
          doc.moveTo(left, currentY).lineTo(left+width, currentY).stroke();

          const startTableY = currentY;
          doc.font('Helvetica').fontSize(8);
          
          const matKeys = Object.keys(alumno.materias);
          
          for(let i=0; i < matKeys.length; i++) {
              let mat = matKeys[i];
              let grades = alumno.materias[mat];
              
              doc.text(mat, colX[0] + 5, currentY + 3, { width: 190 });
              doc.text(grades.inf.toString(), colX[1], currentY + 3, { width: 60, align: 'center'});
              doc.text(grades.pfa.toString(), colX[2], currentY + 3, { width: 60, align: 'center'});
              doc.text(grades.cierre.toString(), colX[3], currentY + 3, { width: 60, align: 'center'});

              currentY += rowHeight;
              doc.moveTo(left, currentY).lineTo(colX[4], currentY).stroke(); // Line until signature
          }
          
          const endTableY = currentY;
          
          doc.moveTo(colX[0], startTableY - rowHeight).lineTo(colX[0], endTableY).stroke();
          doc.moveTo(colX[1], startTableY - rowHeight).lineTo(colX[1], endTableY).stroke();
          doc.moveTo(colX[2], startTableY - rowHeight).lineTo(colX[2], endTableY).stroke();
          doc.moveTo(colX[3], startTableY - rowHeight).lineTo(colX[3], endTableY).stroke();
          doc.moveTo(colX[4], startTableY - rowHeight).lineTo(colX[4], endTableY).stroke();
          doc.moveTo(colX[5], startTableY - rowHeight).lineTo(colX[5], endTableY).stroke();
          
          doc.lineWidth(1.5).rect(left, startTableY - rowHeight, width, endTableY - (startTableY - rowHeight)).stroke();
          
          const insertImage = (base64Str: string, xPos: number, yPos: number, maxWidth: number, maxHeight: number) => {
              try {
                  const part = base64Str.split(',')[1];
                  if(part) {
                     const img = Buffer.from(part, 'base64');
                     doc.image(img, xPos, yPos, { fit: [maxWidth, maxHeight], align: 'center', valign: 'center' });
                  }
              } catch(e) {}
          };

          // Fijas los tamaños en ancho 80 para sello y 100 para firma maximo. Centro = colX[4] + 55
          if (config?.selloBase64) {
              insertImage(config.selloBase64, colX[4] + 15, startTableY + 5, 80, 80);
          }
          if (config?.firmaBase64) {
              let sigY = startTableY + 95;
              insertImage(config.firmaBase64, colX[4] + 10, sigY, 90, 50);
          }
      };

      if (type === 'INDIVIDUAL') {
         if (alumnos.length > 0) drawSlip(alumnos[0], 0, 0);
         doc.end();
      } else {
         for (let i = 0; i < alumnos.length; i++) {
             let yOffset = (i % 2 === 0) ? 0 : 420;
             drawSlip(alumnos[i], 0, yOffset);

             if (i % 2 !== 0 && i !== alumnos.length - 1) {
                 doc.addPage();
             }
         }
         doc.end();
      }
    });
  }

  async generateCalificadoresPDF(cursoId: number, type: 'COURSE' | 'INDIVIDUAL', studentId?: number): Promise<Buffer> {
    const config = await this.prisma.configuracion.findFirst({ where: { id: 1 } });
    
    const course = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      include: {
        orientacion: true,
        inscripciones: {
          where: studentId ? { estudianteId: studentId } : undefined,
          include: {
            estudiante: {
              include: {
                inscripciones: {
                  where: { curso: { cicloLectivo: { enCurso: false } } }, // Historicos !
                  include: {
                    curso: true,
                    calificaciones: { where: { instancia: 'FINAL' }, include: { materia: true } }
                  }
                }
              }
            },
            calificaciones: { include: { materia: true } },
          },
        },
      },
    });

    if (!course) throw new Error('Curso no encontrado');

    let mappedAnio = course.anioCurso;
    if (mappedAnio === '1') mappedAnio = '1ro';
    if (mappedAnio === '2') mappedAnio = '2do';
    if (mappedAnio === '3') mappedAnio = '3ro';
    if (mappedAnio === '4') mappedAnio = '4to';
    if (mappedAnio === '5') mappedAnio = '5to';
    if (mappedAnio === '6') mappedAnio = '6to';
    if (mappedAnio === '7') mappedAnio = '7mo';

    const materiasCondition: any = { anioCurso: mappedAnio };
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

    const materiasNames = materiasList.map((m) => m.nombre);
    const acceptedMateriaIds = new Set(materiasList.map((m) => m.id));

    const periods = [
        "1° Inf. (1er C)",
        "2° Inf. (1er C)",
        "P.F.A (1er C)",
        "Cierre 1er Cuat.",
        "1° Inf. (2do C)",
        "2° Inf. (2do C)",
        "P.F.A (2do C)",
        "Cierre 2do Cuat.",
        "Diciembre",
        "Febrero",
        "Calificación Final"
    ];

    const alumnos = course.inscripciones.map(ins => {
        const student = ins.estudiante;
        
        // Setup Grid
        const gradesByMateria: Record<string, string[]> = {};
        materiasNames.forEach(m => gradesByMateria[m] = new Array(11).fill(''));
        
        // Populate current grades
        ins.calificaciones.forEach(g => {
            if (!acceptedMateriaIds.has(g.materiaId)) return;
            const m = g.materia.nombre;
            
            if (g.cuatrimestre === 1) {
                if (g.instancia === 'INFORME_1') gradesByMateria[m][0] = g.nota.toString();
                else if (g.instancia === 'INFORME_2') gradesByMateria[m][1] = g.nota.toString();
                else if (g.instancia === 'PFA') gradesByMateria[m][2] = g.nota.toString();
                else if (g.instancia === 'CIERRE') gradesByMateria[m][3] = g.nota.toString();
            } else if (g.cuatrimestre === 2) {
                if (g.instancia === 'INFORME_1') gradesByMateria[m][4] = g.nota.toString();
                else if (g.instancia === 'INFORME_2') gradesByMateria[m][5] = g.nota.toString();
                else if (g.instancia === 'PFA') gradesByMateria[m][6] = g.nota.toString();
                else if (g.instancia === 'CIERRE') gradesByMateria[m][7] = g.nota.toString();
            }

            if (g.instancia === 'COMPLEMENTARIO_DIC') gradesByMateria[m][8] = g.nota.toString();
            else if (g.instancia === 'COMPLEMENTARIO_FEB') gradesByMateria[m][9] = g.nota.toString();
            else if (g.instancia === 'FINAL') gradesByMateria[m][10] = g.nota.toString();
        });

        // Determine Previas
        let previas: string[] = [];
        student.inscripciones.forEach(oldIns => {
            oldIns.calificaciones.forEach(oldG => {
                if (oldG.instancia === 'FINAL' && oldG.nota < 6) {
                    previas.push(`${oldG.materia.nombre} (${oldIns.curso.anioCurso})`);
                }
            });
        });

        return {
            id: student.id,
            nombreCompleto: `${student.apellido.toUpperCase()}, ${student.nombre}`,
            gradesByMateria,
            previasStr: previas.length > 0 ? previas.join(', ') : 'Ninguna'
        };
    });

    alumnos.sort((a,b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    const PDFDocument = require('pdfkit');
    // LANDSCAPE A4 for wider grids
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      let drawSlip = (alumno: any) => {
          let y = 60;
          const left = 40;
          const availableWidth = 841.89 - 80;

          const title = config?.nombreInstitucion || 'Colegio Provincial Técnico Soberanía Nacional';
          doc.font('Helvetica-Bold').fontSize(14).text(title.toUpperCase(), left, y, { width: availableWidth, align: 'center' });
          y += 30;

          doc.fontSize(10).text(`ALUMNO/A: ${alumno.nombreCompleto}`, left, y);
          doc.text(`CURSO: ${course.anioCurso} "${course.division}"`, left + 400, y);
          y += 20;

          // Headers
          const numCols = materiasNames.length > 0 ? materiasNames.length + 1 : 1;
          const colWidth = availableWidth / numCols;
          let rowHeight = 40; // Taller for wrapped subjects

          // Header rects
          doc.lineWidth(1).rect(left, y, availableWidth, rowHeight).stroke();
          doc.font('Helvetica-Bold').fontSize(8);
          
          doc.text('PERÍODO', left + 2, y + 15, { width: colWidth - 4, align: 'center' });
          
          materiasNames.forEach((m, idx) => {
              const xPos = left + (colWidth * (idx + 1));
              doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
              doc.text(m.toUpperCase(), xPos + 2, y + 5, { width: colWidth - 4, align: 'center', height: rowHeight - 10 });
          });
          y += rowHeight;

          // Rows
          rowHeight = 24; // Balanced height fits signatures but no text overlap
          doc.font('Helvetica').fontSize(9);
          periods.forEach((period, pIdx) => {
              doc.rect(left, y, availableWidth, rowHeight).stroke();
              doc.fillColor('black').font('Helvetica-Bold').text(period, left + 2, y + 6, { width: colWidth - 4, align: 'left' });
              
              doc.font('Helvetica-Bold');
              materiasNames.forEach((m, mIdx) => {
                  const xPos = left + (colWidth * (mIdx + 1));
                  doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
                  const val = alumno.gradesByMateria[m][pIdx];
                  if (val !== '') {
                      const numVal = Number(val);
                      if (!isNaN(numVal) && numVal < 6) {
                          doc.fillColor('red').text(val, xPos, y + 7, { width: colWidth, align: 'center' }).fillColor('black');
                      } else {
                          doc.fillColor('black').text(val, xPos, y + 7, { width: colWidth, align: 'center' });
                      }
                  }
              });
              y += rowHeight;
          });

          y += 20;
          doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text(`MATERIAS PREVIAS ADEUDADAS: ${alumno.previasStr}`, left, y);
          y += 40;

          // Signatures at the bottom right
          if (config?.selloBase64) {
              try {
                  doc.image(Buffer.from(config.selloBase64.split(',')[1], 'base64'), 841.89 - 220, y - 40, { width: 70, height: 70 });
              } catch(e) {}
          }
          if (config?.firmaBase64) {
              try {
                  doc.image(Buffer.from(config.firmaBase64.split(',')[1], 'base64'), 841.89 - 200, y + 30, { width: 90, height: 50 });
              } catch(e) {}
          }
      };

      for (let i = 0; i < alumnos.length; i++) {
          if (i > 0) doc.addPage();
          drawSlip(alumnos[i]);
      }

      if (alumnos.length === 0) {
          doc.font('Helvetica').fontSize(12).text('No hay alumnos inscriptos en este curso.', 50, 50);
      }

      doc.end();
    });
  }
}
