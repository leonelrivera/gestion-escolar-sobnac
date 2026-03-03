-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'DIRECTIVO', 'JEFE_PRECEPTORES', 'PRECEPTOR', 'SECRETARIA', 'PROSECRETARIA', 'COORDINADOR', 'ADMINISTRATIVO');

-- CreateEnum
CREATE TYPE "CondicionEstudiante" AS ENUM ('REGULAR', 'REPITENTE', 'PASE', 'INGRESO');

-- CreateEnum
CREATE TYPE "InstanciaEvaluacion" AS ENUM ('INFORME_1', 'INFORME_2', 'PFA', 'CIERRE', 'COMPLEMENTARIO_DIC', 'COMPLEMENTARIO_FEB', 'FINAL');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANANA', 'TARDE', 'VESPERTINO');

-- CreateEnum
CREATE TYPE "CondicionInscripcion" AS ENUM ('REGULAR', 'OYENTE', 'LIBRE');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('CURSANDO', 'APROBADO', 'PENDIENTE', 'REPITE');

-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'AUSENTE', 'TARDE', 'RETIRADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "nombre_completo" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclos_lectivos" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "en_curso" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ciclos_lectivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "lugar_nacimiento" TEXT,
    "genero" TEXT,
    "domicilio" TEXT,
    "telefono_contacto" TEXT,
    "email_contacto" TEXT,
    "fecha_ingreso" DATE,
    "institucion_origen" TEXT,
    "fecha_egreso" DATE,
    "institucion_destino" TEXT,
    "condicion" "CondicionEstudiante" NOT NULL DEFAULT 'REGULAR',
    "grupoSanguineo" TEXT,
    "alergias" TEXT,
    "enfermedadesCronicas" TEXT,
    "obraSocial" TEXT,
    "nombreTutor" TEXT,
    "telefonoTutor" TEXT,
    "emailTutor" TEXT,
    "nombre_tutor_alternativo" TEXT,
    "telefono_tutor_alternativo" TEXT,
    "email_tutor_alternativo" TEXT,
    "contactoEmergenciaNombre" TEXT,
    "contactoEmergenciaTelefono" TEXT,
    "orientacion" TEXT,
    "observacionesGenerales" TEXT,
    "usuarioCargaId" INTEGER NOT NULL,
    "usuario_modificacion_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libros_folios" (
    "id" SERIAL NOT NULL,
    "estudiante_id" INTEGER NOT NULL,
    "libro" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "libros_folios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_ciclo" (
    "id" SERIAL NOT NULL,
    "ciclo_lectivo_id" INTEGER NOT NULL,
    "instancia" "InstanciaEvaluacion" NOT NULL,
    "cuatrimestre" INTEGER NOT NULL,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_cierre" TIMESTAMP(3),
    "usuario_cierre_id" INTEGER,

    CONSTRAINT "parametros_ciclo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orientaciones" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "orientaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" SERIAL NOT NULL,
    "ciclo_lectivo_id" INTEGER NOT NULL,
    "anio_curso" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "turno" "Turno",
    "orientacion_id" INTEGER,
    "preceptor_id" INTEGER,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "anio_curso" TEXT,
    "orientacion_filtro" TEXT,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" SERIAL NOT NULL,
    "estudiante_id" INTEGER NOT NULL,
    "curso_id" INTEGER NOT NULL,
    "fecha_inscripcion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condicion" "CondicionInscripcion" NOT NULL DEFAULT 'REGULAR',
    "estado_final" "EstadoInscripcion",

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificaciones" (
    "id" SERIAL NOT NULL,
    "inscripcion_id" INTEGER NOT NULL,
    "materia_id" INTEGER NOT NULL,
    "cuatrimestre" INTEGER NOT NULL DEFAULT 1,
    "instancia" "InstanciaEvaluacion" NOT NULL DEFAULT 'INFORME_1',
    "nota" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "fecha_carga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_carga_id" INTEGER,

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" SERIAL NOT NULL,
    "inscripcion_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presente" BOOLEAN NOT NULL,
    "justificado" BOOLEAN DEFAULT false,
    "observaciones" TEXT,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ciclos_lectivos_anio_key" ON "ciclos_lectivos"("anio");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_dni_key" ON "estudiantes"("dni");

-- CreateIndex
CREATE INDEX "estudiantes_dni_idx" ON "estudiantes"("dni");

-- CreateIndex
CREATE INDEX "estudiantes_apellido_idx" ON "estudiantes"("apellido");

-- CreateIndex
CREATE UNIQUE INDEX "parametros_ciclo_ciclo_lectivo_id_instancia_cuatrimestre_key" ON "parametros_ciclo"("ciclo_lectivo_id", "instancia", "cuatrimestre");

-- CreateIndex
CREATE UNIQUE INDEX "orientaciones_nombre_key" ON "orientaciones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_ciclo_lectivo_id_anio_curso_division_turno_key" ON "cursos"("ciclo_lectivo_id", "anio_curso", "division", "turno");

-- CreateIndex
CREATE INDEX "inscripciones_curso_id_idx" ON "inscripciones"("curso_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_estudiante_id_curso_id_key" ON "inscripciones"("estudiante_id", "curso_id");

-- CreateIndex
CREATE INDEX "calificaciones_inscripcion_id_idx" ON "calificaciones"("inscripcion_id");

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_inscripcion_id_materia_id_cuatrimestre_insta_key" ON "calificaciones"("inscripcion_id", "materia_id", "cuatrimestre", "instancia");

-- CreateIndex
CREATE INDEX "asistencias_inscripcion_id_idx" ON "asistencias"("inscripcion_id");

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuarioCargaId_fkey" FOREIGN KEY ("usuarioCargaId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuario_modificacion_id_fkey" FOREIGN KEY ("usuario_modificacion_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libros_folios" ADD CONSTRAINT "libros_folios_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametros_ciclo" ADD CONSTRAINT "parametros_ciclo_ciclo_lectivo_id_fkey" FOREIGN KEY ("ciclo_lectivo_id") REFERENCES "ciclos_lectivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametros_ciclo" ADD CONSTRAINT "parametros_ciclo_usuario_cierre_id_fkey" FOREIGN KEY ("usuario_cierre_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_ciclo_lectivo_id_fkey" FOREIGN KEY ("ciclo_lectivo_id") REFERENCES "ciclos_lectivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_orientacion_id_fkey" FOREIGN KEY ("orientacion_id") REFERENCES "orientaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_preceptor_id_fkey" FOREIGN KEY ("preceptor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_usuario_carga_id_fkey" FOREIGN KEY ("usuario_carga_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

