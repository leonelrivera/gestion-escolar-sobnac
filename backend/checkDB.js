const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const materias = await prisma.materia.findMany();
    console.log('Total materias:', materias.length);
    console.log('Sample materias:', materias.slice(0, 3));
    
    // Check if what I get from a specific curso actually gets grades
    const firstGrades = await prisma.calificacion.findMany({take:5, include: { materia: true }});
    console.log('First 5 grades:', firstGrades);
}
main().finally(() => prisma.$disconnect());
