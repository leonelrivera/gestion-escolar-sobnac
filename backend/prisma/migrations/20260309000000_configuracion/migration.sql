-- CreateTable
CREATE TABLE "configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombre_institucion" TEXT NOT NULL DEFAULT 'SGE - Soberanía Nacional',
    "logo_base64" TEXT,
    "pie_de_pagina" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);
