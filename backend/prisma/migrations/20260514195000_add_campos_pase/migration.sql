-- AlterTable
ALTER TABLE "estudiantes" ADD COLUMN "pase_destino" TEXT;
ALTER TABLE "estudiantes" ADD COLUMN "pase_colegio" TEXT;
ALTER TABLE "estudiantes" ADD COLUMN "pase_fecha" DATE;
ALTER TABLE "estudiantes" ADD COLUMN "pase_estado" TEXT;

-- AlterTable
ALTER TABLE "estudiantes" ALTER COLUMN "lugar_nacimiento" DROP NOT NULL;
