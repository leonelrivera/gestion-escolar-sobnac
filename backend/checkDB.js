const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  console.log('Cursos:', await prisma.curso.findMany({take: 2})); 
  console.log('Materias:', await prisma.materia.findMany({take: 8})); 
} 

main().finally(()=>prisma.$disconnect());
