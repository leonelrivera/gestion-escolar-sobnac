import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const subjects = await prisma.materia.findMany();
    console.log('--- Subjects List ---');
    subjects.forEach(s => {
        console.log(`ID: ${s.id}, Name: '${s.nombre}', Year: '${s.anioCurso}'`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
