/*
  Warnings:

  - You are about to drop the `permisos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rol_permisos` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ModuloSistema" AS ENUM ('DOCUMENTOS', 'OBJETIVOS', 'RIESGOS', 'NO_CONFORMIDADES', 'AUDITORIAS', 'INDICADORES', 'PERSONAS', 'PROVEEDORES', 'COMUNICACIONES');

-- CreateEnum
CREATE TYPE "NivelPermiso" AS ENUM ('NINGUNO', 'VER', 'EDITAR', 'APROBAR');

-- DropForeignKey
ALTER TABLE "rol_permisos" DROP CONSTRAINT "rol_permisos_permisoId_fkey";

-- DropForeignKey
ALTER TABLE "rol_permisos" DROP CONSTRAINT "rol_permisos_rolId_fkey";

-- DropTable
DROP TABLE "permisos";

-- DropTable
DROP TABLE "rol_permisos";

-- CreateTable
CREATE TABLE "permisos_modulo" (
    "id" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "modulo" "ModuloSistema" NOT NULL,
    "nivel" "NivelPermiso" NOT NULL DEFAULT 'NINGUNO',

    CONSTRAINT "permisos_modulo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permisos_modulo_rolId_modulo_key" ON "permisos_modulo"("rolId", "modulo");

-- AddForeignKey
ALTER TABLE "permisos_modulo" ADD CONSTRAINT "permisos_modulo_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
