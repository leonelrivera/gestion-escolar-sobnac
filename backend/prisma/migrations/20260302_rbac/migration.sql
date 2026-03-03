-- AlterEnum
BEGIN;
CREATE TYPE "Rol_new" AS ENUM ('ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR', 'PRECEPTOR');
ALTER TABLE "usuarios" ALTER COLUMN "rol" TYPE "Rol_new" USING ("rol"::text::"Rol_new");
ALTER TYPE "Rol" RENAME TO "Rol_old";
ALTER TYPE "Rol_new" RENAME TO "Rol";
DROP TYPE "Rol_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "cursos" DROP CONSTRAINT "cursos_preceptor_id_fkey";

-- AlterTable
ALTER TABLE "cursos" DROP COLUMN "preceptor_id";

-- CreateTable
CREATE TABLE "asignaciones" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "curso_id" INTEGER NOT NULL,

    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_usuario_id_curso_id_key" ON "asignaciones"("usuario_id", "curso_id");

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;