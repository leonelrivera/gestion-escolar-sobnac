import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando Saneamiento y Seeding (Refactor Versión) ---');

    // 1. Limpieza total en orden inverso a dependencias
    console.log('Limpando tablas...');
    await prisma.calificacion.deleteMany({});
    await prisma.asistencia.deleteMany({});
    await prisma.inscripcion.deleteMany({});
    await prisma.parametrosCiclo.deleteMany({});
    await prisma.curso.deleteMany({});
    await prisma.materia.deleteMany({});
    await prisma.estudiante.deleteMany({});
    // await prisma.orientacion.deleteMany({}); // Opcional
    // await prisma.cicloLectivo.deleteMany({}); // Opcional

    const password = await bcrypt.hash('admin123', 10);

    // 2. Usuarios
    await prisma.usuario.upsert({
        where: { email: 'admin@escuela.com' },
        update: {},
        create: {
            email: 'admin@escuela.com',
            nombreCompleto: 'Administrador Sistema',
            passwordHash: password,
            rol: 'ADMIN',
            activo: true,
        },
    });

    // 3. Ciclos Lectivos
    const ciclo2025 = await prisma.cicloLectivo.upsert({
        where: { anio: 2025 },
        update: { enCurso: false },
        create: { anio: 2025, fechaInicio: new Date('2025-03-01'), fechaFin: new Date('2025-12-15'), enCurso: false },
    });

    const ciclo2026 = await prisma.cicloLectivo.upsert({
        where: { anio: 2026 },
        update: { enCurso: true },
        create: { anio: 2026, fechaInicio: new Date('2026-03-01'), fechaFin: new Date('2026-12-15'), enCurso: true },
    });

    // 4. Orientaciones
    const eso = await prisma.orientacion.findFirst({ where: { nombre: 'E.S.O' } });
    const esoId = eso?.id || (await prisma.orientacion.create({ data: { nombre: 'E.S.O' } })).id;

    // 5. Materias
    const mat1 = await prisma.materia.create({ data: { nombre: 'Matemática', anioCurso: '1ro' } });
    const len1 = await prisma.materia.create({ data: { nombre: 'Lengua', anioCurso: '1ro' } });
    const mat2 = await prisma.materia.create({ data: { nombre: 'Matemática', anioCurso: '2do' } });

    // 6. Cursos
    const curso1A_2025 = await prisma.curso.create({
        data: { anioCurso: '1ro', division: 'A', turno: 'MANANA', cicloLectivoId: ciclo2025.id, orientacionId: esoId }
    });

    const curso2A_2026 = await prisma.curso.create({
        data: { anioCurso: '2do', division: 'A', turno: 'MANANA', cicloLectivoId: ciclo2026.id, orientacionId: esoId }
    });

    // 7. Estudiantes
    console.log('Creando estudiantes...');
    const student1 = await prisma.estudiante.create({
        data: {
            dni: '11111111',
            apellido: 'GONZALEZ',
            nombre: 'JUAN PABLO',
            fechaNacimiento: new Date('2010-05-15'),
            condicion: 'REGULAR',
            usuarioCargaId: 1
        }
    });

    const student2 = await prisma.estudiante.create({
        data: {
            dni: '22222222',
            apellido: 'RODRIGUEZ',
            nombre: 'MARIA BELEN',
            fechaNacimiento: new Date('2011-08-20'),
            condicion: 'REGULAR',
            usuarioCargaId: 1
        }
    });

    // 8. Inscripciones
    console.log('Inscribiendo estudiantes...');

    // Juan estuvo en 1ro en 2025 y ahora está en 2do en 2026
    const insJuan2025 = await prisma.inscripcion.create({
        data: { estudianteId: student1.id, cursoId: curso1A_2025.id, condicion: 'REGULAR' }
    });

    const insJuan2026 = await prisma.inscripcion.create({
        data: { estudianteId: student1.id, cursoId: curso2A_2026.id, condicion: 'REGULAR' }
    });

    // Maria entró directo a 2do en 2026
    const insMaria2026 = await prisma.inscripcion.create({
        data: { estudianteId: student2.id, cursoId: curso2A_2026.id, condicion: 'REGULAR' }
    });

    // 9. Calificaciones (Históricas 2025 para Juan)
    console.log('Cargando notas históricas...');
    await prisma.calificacion.create({
        data: {
            inscripcionId: insJuan2025.id,
            materiaId: mat1.id,
            cuatrimestre: 1,
            instancia: 'FINAL',
            nota: 8.5
        }
    });
    await prisma.calificacion.create({
        data: {
            inscripcionId: insJuan2025.id,
            materiaId: len1.id,
            cuatrimestre: 1,
            instancia: 'FINAL',
            nota: 7.0
        }
    });

    // 10. Calificaciones (Actuales 2026)
    await prisma.calificacion.create({
        data: {
            inscripcionId: insJuan2026.id,
            materiaId: mat2.id,
            cuatrimestre: 1,
            instancia: 'INFORME_1',
            nota: 9.0
        }
    });

    // 11. Asistencias
    await prisma.asistencia.create({
        data: { inscripcionId: insJuan2025.id, fecha: new Date('2025-04-10'), presente: true }
    });
    await prisma.asistencia.create({
        data: { inscripcionId: insJuan2025.id, fecha: new Date('2025-04-11'), presente: false }
    });
    await prisma.asistencia.create({
        data: { inscripcionId: insJuan2026.id, fecha: new Date('2026-03-10'), presente: true }
    });

    console.log('--- Seeding Completado Exitosamente ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
