import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const name = 'Materia de Prueba';
    const subj = await prisma.materia.findFirst({ where: { nombre: name } });
    if (subj) {
        console.log(`Eliminando materia: ${subj.nombre} (ID: ${subj.id})`);
        try {
            await prisma.materia.delete({ where: { id: subj.id } });
            console.log('Materia eliminada con éxito.');
        } catch (error: any) {
            console.error('Error al eliminar:', error.message);
        }
    } else {
        console.log('No se encontró la materia de prueba.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
