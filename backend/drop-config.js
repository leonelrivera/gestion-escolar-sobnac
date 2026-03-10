const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "configuracion" CASCADE;`);
        console.log('Tabla configuracion eliminada para forzar migración limpia.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
