-- CreateEnum
CREATE TYPE "CategoriaCambio" AS ENUM ('MATERIA_PRIMA_PROCESO_EQUIPO', 'ETIQUETADO_DECLARACION', 'PPR_CONTROL_OPERACIONAL', 'REQUISITO_ESQUEMA_BOS', 'ALCANCE_CERTIFICACION');

-- CreateEnum
CREATE TYPE "EstadoCambio" AS ENUM ('BORRADOR', 'COMUNICADO', 'IMPLEMENTADO', 'CANCELADO');

-- AlterEnum
ALTER TYPE "ModuloSistema" ADD VALUE 'GESTION_CAMBIOS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoNotificacion" ADD VALUE 'CAMBIO_COMUNICADO';
ALTER TYPE "TipoNotificacion" ADD VALUE 'CAMBIO_TRANSICION_PROXIMA';

-- CreateTable
CREATE TABLE "gestion_cambios" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" "CategoriaCambio" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "impactoInocuidad" TEXT NOT NULL,
    "impactoAlcance" BOOLEAN NOT NULL DEFAULT false,
    "procesoId" TEXT,
    "documentosRelacionados" TEXT,
    "solicitanteId" TEXT NOT NULL,
    "fechaEfectiva" TIMESTAMP(3),
    "plazoTransicion" TIMESTAMP(3),
    "estado" "EstadoCambio" NOT NULL DEFAULT 'BORRADOR',
    "comunicadoPorId" TEXT,
    "fechaComunicacion" TIMESTAMP(3),
    "fechaImplementacion" TIMESTAMP(3),
    "evidenciaImplementacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "gestion_cambios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gestion_cambios_codigo_key" ON "gestion_cambios"("codigo");

-- CreateIndex
CREATE INDEX "gestion_cambios_estado_idx" ON "gestion_cambios"("estado");

-- CreateIndex
CREATE INDEX "gestion_cambios_categoria_idx" ON "gestion_cambios"("categoria");

-- AddForeignKey
ALTER TABLE "gestion_cambios" ADD CONSTRAINT "gestion_cambios_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestion_cambios" ADD CONSTRAINT "gestion_cambios_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestion_cambios" ADD CONSTRAINT "gestion_cambios_comunicadoPorId_fkey" FOREIGN KEY ("comunicadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
