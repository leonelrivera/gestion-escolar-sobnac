import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando migración de divisiones...');

    const cursos = await prisma.curso.findMany();
    let actualizados = 0;

    for (const curso of cursos) {
        let nvaDivision = curso.division.toLowerCase().trim();

        // Mapeos básicos por si se ingresó "A" o similares (opcional, ajustarlo al estándar)
        // Como sabemos que quieren 1ra a 7ma, simplemente intentaremos forzar al formato esperado.
        if (nvaDivision === 'a' || nvaDivision === '1ro' || nvaDivision === '1') nvaDivision = '1ra';
        if (nvaDivision === 'b' || nvaDivision === '2do' || nvaDivision === '2') nvaDivision = '2da';
        if (nvaDivision === 'c' || nvaDivision === '3ro' || nvaDivision === '3') nvaDivision = '3ra';
        if (nvaDivision === 'd' || nvaDivision === '4to' || nvaDivision === '4') nvaDivision = '4ta';
        if (nvaDivision === 'e' || nvaDivision === '5to' || nvaDivision === '5') nvaDivision = '5ta';
        if (nvaDivision === 'f' || nvaDivision === '6to' || nvaDivision === '6') nvaDivision = '6ta';
        if (nvaDivision === 'g' || nvaDivision === '7mo' || nvaDivision === '7') nvaDivision = '7ma';

        // Validar que solo queden los permitidos
        const validos = ['1ra', '2da', '3ra', '4ta', '5ta', '6ta', '7ma'];
        
        if (validos.includes(nvaDivision)) {
            if (nvaDivision !== curso.division) {
                // Hay que actualizar
                await prisma.curso.update({
                    where: { id: curso.id },
                    data: { division: nvaDivision }
                });
                console.log(`✅ Curso ID ${curso.id}: "${curso.division}" actualizado a "${nvaDivision}"`);
                actualizados++;
            }
        } else {
            console.log(`⚠️ Curso ID ${curso.id}: División desconocida "${curso.division}". Se omite.`);
        }
    }

    console.log(`Migración finalizada. Se actualizaron ${actualizados} cursos.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
