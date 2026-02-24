import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const subjects = await prisma.materia.findMany();
    const uniqueMap = new Map<string, number>(); // key: "nombre-anioCurso", value: id (kept)

    for (const subject of subjects) {
        const key = `${subject.nombre}-${subject.anioCurso}`;

        if (uniqueMap.has(key)) {
            const keepId = uniqueMap.get(key)!;
            const duplicateId = subject.id;

            console.log(`Duplicate found: ${subject.nombre} (${subject.anioCurso}). Keep: ${keepId}, Delete: ${duplicateId}`);

            // 1. Move Grades
            await prisma.calificacion.updateMany({
                where: { materiaId: duplicateId },
                data: { materiaId: keepId }
            });

            // 2. Delete Duplicate
            await prisma.materia.delete({
                where: { id: duplicateId }
            });
        } else {
            uniqueMap.set(key, subject.id);
        }
    }

    console.log('Deduplication complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
