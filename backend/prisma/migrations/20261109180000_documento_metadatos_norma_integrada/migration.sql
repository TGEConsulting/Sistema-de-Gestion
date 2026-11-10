-- AlterTable: metadatos del sistema documental (Lista Maestra PR-IMS-01-F01)
ALTER TABLE "documentos" ADD COLUMN "documentoPadreId" TEXT,
ADD COLUMN "nivel" INTEGER,
ADD COLUMN "revision" TEXT,
ADD COLUMN "clausulas" TEXT,
ADD COLUMN "evidencias" TEXT,
ADD COLUMN "participa" TEXT,
ADD COLUMN "autoriza" TEXT,
ADD COLUMN "carpeta" TEXT,
ADD COLUMN "critico" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "documentos_documentoPadreId_idx" ON "documentos"("documentoPadreId");

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_documentoPadreId_fkey" FOREIGN KEY ("documentoPadreId") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
