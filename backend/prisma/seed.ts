import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.usuario.upsert({
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

    console.log({ admin });

    // Seed Cycles
    const ciclo2025 = await prisma.cicloLectivo.upsert({
        where: { anio: 2025 },
        update: {},
        create: {
            anio: 2025,
            fechaInicio: new Date('2025-03-01'),
            fechaFin: new Date('2025-12-15'),
            enCurso: false,
        },
    });

    const ciclo2026 = await prisma.cicloLectivo.upsert({
        where: { anio: 2026 },
        update: {},
        create: {
            anio: 2026,
            fechaInicio: new Date('2026-03-01'),
            fechaFin: new Date('2026-12-15'),
            enCurso: true,
        },
    });

    console.log({ ciclo2025, ciclo2026 });

    // Seed Subjects
    const subjects = [
        { nombre: 'Matemática', anioCurso: '1ro' },
        { nombre: 'Lengua', anioCurso: '1ro' },
        { nombre: 'Historia', anioCurso: '1ro' },
        { nombre: 'Geografía', anioCurso: '1ro' },
        { nombre: 'Biología', anioCurso: '1ro' },
        { nombre: 'Física', anioCurso: '2do' },
        { nombre: 'Química', anioCurso: '2do' },
    ];

    for (const subject of subjects) {
        const existing = await prisma.materia.findFirst({
            where: { nombre: subject.nombre, anioCurso: subject.anioCurso }
        });
        if (!existing) {
            await prisma.materia.create({ data: subject });
        }
    }

    console.log('Materias seeded');

    // Seed Orientaciones
    const orientaciones = [
        'E.S.O',
        'Educación Física',
        'Comunicación',
        'Economía y Administración',
        'Hidrocarburo',
        'Energía Renovable',
    ];

    for (const nombre of orientaciones) {
        await prisma.orientacion.upsert({
            where: { nombre },
            update: {},
            create: { nombre },
        });
    }

    console.log('Orientaciones seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
