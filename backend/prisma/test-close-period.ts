import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Get Cycle 2026
    const ciclo = await prisma.cicloLectivo.findUnique({ where: { anio: 2026 } });
    if (!ciclo) throw new Error('Ciclo 2026 no encontrado');

    // 2. Close "INFORME_1" for 1st Quarter
    console.log('Cerrando Informe 1 - Cuatrimestre 1...');
    await prisma.parametrosCiclo.upsert({
        where: {
            cicloLectivoId_instancia_cuatrimestre: {
                cicloLectivoId: ciclo.id,
                instancia: 'INFORME_1',
                cuatrimestre: 1
            }
        },
        update: {
            cerrado: true,
            fechaCierre: new Date()
        },
        create: {
            cicloLectivoId: ciclo.id,
            instancia: 'INFORME_1',
            cuatrimestre: 1,
            cerrado: true,
            fechaCierre: new Date()
        }
    });

    console.log('Periodo cerrado exitosamente.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
