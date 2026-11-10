-- AlterEnum
ALTER TYPE "ModuloSistema" ADD VALUE 'REQUISITOS';
ALTER TYPE "ModuloSistema" ADD VALUE 'MATRIZ_COMUNICACION';

-- AlterEnum
ALTER TYPE "TipoNotificacion" ADD VALUE 'REQUISITO_POR_EVALUAR';

-- CreateEnum
CREATE TYPE "TipoRequisito" AS ENUM ('LEGAL', 'ESQUEMA', 'CLIENTE', 'OTRO');
CREATE TYPE "EstadoCumplimientoRequisito" AS ENUM ('POR_EVALUAR', 'CUMPLE', 'PARCIAL', 'NO_CUMPLE', 'NO_APLICA');
CREATE TYPE "EstadoInterfaz" AS ENUM ('PROPUESTA', 'ACEPTADA', 'CON_AJUSTE', 'RECHAZADA');

-- CreateTable
CREATE TABLE "requisitos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRequisito" NOT NULL,
    "sistema" TEXT,
    "requisito" TEXT NOT NULL,
    "fuente" TEXT,
    "apartado" TEXT,
    "comoSeCumple" TEXT,
    "documentos" TEXT,
    "areaId" TEXT,
    "responsableId" TEXT,
    "fechaVigor" TIMESTAMP(3),
    "vigenciaConfirmada" TEXT,
    "estado" "EstadoCumplimientoRequisito" NOT NULL DEFAULT 'POR_EVALUAR',
    "evidencia" TEXT,
    "proximaEvaluacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "requisitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicacion_interfaces" (
    "id" TEXT NOT NULL,
    "documentoCodigo" TEXT NOT NULL,
    "documentoTitulo" TEXT,
    "areaDuenaId" TEXT NOT NULL,
    "areaContraparteId" TEXT,
    "contraparteTexto" TEXT NOT NULL,
    "entrega" TEXT,
    "recibe" TEXT,
    "plazo" TEXT,
    "estado" "EstadoInterfaz" NOT NULL DEFAULT 'PROPUESTA',
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "comunicacion_interfaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "requisitos_tipo_idx" ON "requisitos"("tipo");
CREATE INDEX "requisitos_estado_idx" ON "requisitos"("estado");
CREATE INDEX "comunicacion_interfaces_documentoCodigo_idx" ON "comunicacion_interfaces"("documentoCodigo");
CREATE INDEX "comunicacion_interfaces_areaDuenaId_idx" ON "comunicacion_interfaces"("areaDuenaId");
CREATE INDEX "comunicacion_interfaces_areaContraparteId_idx" ON "comunicacion_interfaces"("areaContraparteId");

-- AddForeignKey
ALTER TABLE "requisitos" ADD CONSTRAINT "requisitos_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "requisitos" ADD CONSTRAINT "requisitos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comunicacion_interfaces" ADD CONSTRAINT "comunicacion_interfaces_areaDuenaId_fkey" FOREIGN KEY ("areaDuenaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comunicacion_interfaces" ADD CONSTRAINT "comunicacion_interfaces_areaContraparteId_fkey" FOREIGN KEY ("areaContraparteId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "esquema_referencias" (
    "id" TEXT NOT NULL,
    "esquema" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "clausula" TEXT NOT NULL,

    CONSTRAINT "esquema_referencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "esquema_referencias_esquema_referencia_clausula_key" ON "esquema_referencias"("esquema", "referencia", "clausula");
CREATE INDEX "esquema_referencias_esquema_idx" ON "esquema_referencias"("esquema");
