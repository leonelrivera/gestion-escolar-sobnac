import { PrismaClient, InstanciaEvaluacion } from '@prisma/client';

const prisma = new PrismaClient();

const ESO_SUBJECTS = [
    'Prácticas del Lenguaje',
    'Lengua Extranjera',
    'Matemática',
    'Historia',
    'Geografía',
    'Construcción de la Ciudadanía',
    'Biología',
    'Físico-Química',
    'Lenguajes Artísticos', // (Teatro / Expresión Corporal / Plástica / Música)
    'Educación Física',
    'Educación Tecnológica'
];

const CURRICULUM = [
    {
        orientacion: 'E.S.O',
        years: [
            { id: '1ro', subjects: ESO_SUBJECTS },
            { id: '2do', subjects: ESO_SUBJECTS },
            { id: '3ro', subjects: ESO_SUBJECTS },
        ]
    },
    {
        orientacion: 'Educación Física',
        years: [
            {
                id: '4to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Historia',
                    'Geografía', 'Química', 'Construcción de la Ciudadanía', 'Salud y Derecho',
                    'Lenguajes Artísticos', 'Prácticas Deportivas I', 'Prácticas Corporales en el Amb. Natural'
                ]
            },
            {
                id: '5to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Historia',
                    'Geografía', 'Biología', 'Construcción de la Ciudadanía', 'Prácticas Deportivas II',
                    'Lenguajes Artísticos', 'Prácticas Corporales en el Amb. Natural', 'Prácticas Gimnásticas'
                ]
            },
            {
                id: '6to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Historia',
                    'Economía', 'Prácticas Deportivas III', 'Física', 'Filosofía',
                    'Diseño y Gestión de Proyectos', 'Lenguajes Artísticos', 'Psicología', 'Actividad Física y Salud'
                ]
            },
        ]
    },
    {
        orientacion: 'Comunicación',
        years: [
            {
                id: '4to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Historia',
                    'Geografía', 'Química', 'Construcción de la Ciudadanía', 'Salud y Derecho',
                    'Lenguajes Artísticos', 'Introducción a la Comunicación', 'Introducción a los Multimedios'
                ]
            },
            {
                id: '5to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Historia',
                    'Geografía', 'Biología', 'Construcción de la Ciudadanía', 'Comunicación, Cultura y Sociedad',
                    'Lenguajes Artísticos', 'Observatorio de Medios', 'Investigación en Comunicación'
                ]
            },
            {
                id: '6to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Economía',
                    'Comunicación Institucional y Comunitaria', 'Física', 'Filosofía',
                    'Taller de Producción de Mensajes', 'Lenguajes Artísticos', 'Comunicación y Culturas del Consumo'
                ]
            },
        ]
    },
    {
        orientacion: 'Economía y Administración',
        years: [
            {
                id: '4to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Historia',
                    'Geografía', 'Química', 'Construcción de la Ciudadanía', 'Salud y Derecho',
                    'Lenguajes Artísticos', 'Administración I', 'Sistemas de Información Contable I'
                ]
            },
            {
                id: '5to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Historia',
                    'Geografía', 'Biología', 'Construcción de la Ciudadanía', 'Microeconomía',
                    'Lenguajes Artísticos', 'Administración II', 'Sistemas de Información Contable II'
                ]
            },
            {
                id: '6to',
                subjects: [
                    'Matemática', 'Prácticas del Lenguaje', 'Inglés', 'Educación Física', 'Economía',
                    'Microemprendimiento', 'Física', 'Filosofía', 'Legislación Impositiva y Régimen Laboral',
                    'Lenguajes Artísticos', 'Derecho Económico', 'Sistemas de Información Contable III'
                ]
            },
        ]
    }
];

async function main() {
    console.log('Iniciando carga de Caja Curricular...');

    for (const orientacionData of CURRICULUM) {
        console.log(`Cargando Orientación: ${orientacionData.orientacion}`);

        for (const year of orientacionData.years) {
            console.log(`  Año: ${year.id}`);

            for (const subjectName of year.subjects) {
                const existing = await prisma.materia.findFirst({
                    where: {
                        nombre: subjectName,
                        anioCurso: year.id,
                        orientacionFiltro: orientacionData.orientacion
                    }
                });

                if (!existing) {
                    await prisma.materia.create({
                        data: {
                            nombre: subjectName,
                            anioCurso: year.id,
                            orientacionFiltro: orientacionData.orientacion
                        }
                    });
                    console.log(`    Creada: ${subjectName}`);
                } else {
                    console.log(`    Ya existe: ${subjectName}`);
                }
            }
        }
    }

    console.log('Carga masiva completada con éxito.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
