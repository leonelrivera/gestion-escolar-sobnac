import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Get Cycle 2026
    const ciclo = await prisma.cicloLectivo.findUnique({ where: { anio: 2026 } });
    if (!ciclo) throw new Error('Ciclo 2026 not found. Run seed.ts first.');

    // 2. Get Orientation
    const orientacion = await prisma.orientacion.findFirst();

    // 3. Create Course
    const curso = await prisma.curso.create({
        data: {
            cicloLectivoId: ciclo.id,
            anioCurso: '1ro',
            division: 'A',
            turno: 'MANANA',
            orientacionId: orientacion?.id,
        }
    });
    console.log('Curso creado:', curso);

    // 4. Create Students
    const studentsData = [
        { dni: '11111111', apellido: 'Gomez', nombre: 'Juan', fechaNacimiento: new Date('2010-05-15') },
        { dni: '22222222', apellido: 'Perez', nombre: 'Maria', fechaNacimiento: new Date('2010-08-20') },
        { dni: '33333333', apellido: 'Lopez', nombre: 'Carlos', fechaNacimiento: new Date('2010-02-10') },
        { dni: '44444444', apellido: 'Diaz', nombre: 'Ana', fechaNacimiento: new Date('2010-11-05') },
        { dni: '55555555', apellido: 'Romero', nombre: 'Luis', fechaNacimiento: new Date('2010-06-30') },
    ];

    for (const s of studentsData) {
        const student = await prisma.estudiante.create({
            data: {
                ...s,
                usuarioCargaId: 1, // Admin
            }
        });

        // 5. Enroll in Course
        await prisma.inscripcion.create({
            data: {
                estudianteId: student.id,
                cursoId: curso.id,
                fechaInscripcion: new Date(),
                condicion: 'REGULAR',
            }
        });
        console.log(`Estudiante ${s.apellido} inscrito.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
