-- CreateEnum
CREATE TYPE "NombreRol" AS ENUM ('ADMIN', 'AUDITOR', 'RESPONSABLE_PROCESO', 'LECTURA');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('BORRADOR', 'EN_REVISION', 'APROBADO', 'OBSOLETO');

-- CreateEnum
CREATE TYPE "EstadoObjetivo" AS ENUM ('PLANEADO', 'EN_PROCESO', 'LOGRADO', 'NO_LOGRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoObjetivo" AS ENUM ('ESTRATEGICO', 'OPERATIVO');

-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'ATRASADA');

-- CreateEnum
CREATE TYPE "NivelRiesgo" AS ENUM ('BAJO', 'MODERADO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "EstadoRiesgo" AS ENUM ('IDENTIFICADO', 'EN_TRATAMIENTO', 'MITIGADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoTratamientoRiesgo" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'IMPLEMENTADO', 'VERIFICADO');

-- CreateEnum
CREATE TYPE "OrigenNC" AS ENUM ('AUDITORIA', 'RECLAMO', 'INCIDENTE', 'INSPECCION', 'AUTOEVALUACION');

-- CreateEnum
CREATE TYPE "EstadoNC" AS ENUM ('ABIERTA', 'EN_ANALISIS', 'ACCION_DEFINIDA', 'EN_IMPLEMENTACION', 'CERRADA', 'INEFICAZ');

-- CreateEnum
CREATE TYPE "TipoAccion" AS ENUM ('INMEDIATA', 'CORRECTIVA', 'PREVENTIVA');

-- CreateEnum
CREATE TYPE "EstadoAccion" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "TipoAuditoria" AS ENUM ('INTERNA', 'EXTERNA', 'CERTIFICACION');

-- CreateEnum
CREATE TYPE "EstadoAuditoria" AS ENUM ('PROGRAMADA', 'EN_EJECUCION', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "RespuestaChecklist" AS ENUM ('CUMPLE', 'NO_CUMPLE', 'NO_APLICA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "TipoHallazgo" AS ENUM ('NO_CONFORMIDAD', 'OBSERVACION', 'OPORTUNIDAD_MEJORA', 'FORTALEZA');

-- CreateEnum
CREATE TYPE "FrecuenciaIndicador" AS ENUM ('DIARIA', 'SEMANAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "DireccionIndicador" AS ENUM ('MAYOR_ES_MEJOR', 'MENOR_ES_MEJOR');

-- CreateEnum
CREATE TYPE "TipoProveedor" AS ENUM ('INSUMOS', 'SERVICIOS', 'TRANSPORTE', 'MAQUINARIA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoProveedor" AS ENUM ('EN_EVALUACION', 'ACTIVO', 'SUSPENDIDO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('DOCUMENTO_POR_VENCER', 'NC_SIN_ATENDER', 'INDICADOR_SIN_CAPTURA', 'AUDITORIA_PROXIMA', 'TAREA_ASIGNADA', 'ACTIVIDAD_ATRASADA', 'ACCION_VENCIDA', 'RIESGO_SIN_TRATAMIENTO');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'VENCIDA');

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puestos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "puestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" "NombreRol" NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "rolId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "puestoId" TEXT,
    "areaId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "personaId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipoDocumentoId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'BORRADOR',
    "versionVigenteId" TEXT,
    "proximaRevision" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiones_documento" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "numeroVersion" INTEGER NOT NULL,
    "archivoUrl" TEXT,
    "cambios" TEXT,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'EN_REVISION',
    "creadoPorId" TEXT NOT NULL,
    "aprobadoPorId" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versiones_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias_lectura" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "versionDocumentoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "medio" TEXT,
    "fechaLectura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_lectura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetivos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoObjetivo" NOT NULL DEFAULT 'OPERATIVO',
    "areaId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoObjetivo" NOT NULL DEFAULT 'PLANEADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "objetivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" TEXT NOT NULL,
    "objetivoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "responsableId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoObjetivo" NOT NULL DEFAULT 'PLANEADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "responsableId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoActividad" NOT NULL DEFAULT 'PENDIENTE',
    "avancePorcentaje" INTEGER NOT NULL DEFAULT 0,
    "evidenciaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procesos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "responsableId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "procesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_riesgo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categorias_riesgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riesgos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "probabilidad" INTEGER NOT NULL,
    "impacto" INTEGER NOT NULL,
    "puntajeRiesgo" INTEGER NOT NULL,
    "nivelRiesgo" "NivelRiesgo" NOT NULL,
    "controlesExistentes" TEXT,
    "responsableId" TEXT NOT NULL,
    "estado" "EstadoRiesgo" NOT NULL DEFAULT 'IDENTIFICADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "riesgos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_tratamiento_riesgo" (
    "id" TEXT NOT NULL,
    "riesgoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "fechaCompromiso" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoTratamientoRiesgo" NOT NULL DEFAULT 'PENDIENTE',
    "evidenciaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_tratamiento_riesgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "no_conformidades" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "origen" "OrigenNC" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "procesoId" TEXT,
    "causaRaiz" TEXT,
    "responsableId" TEXT NOT NULL,
    "fechaDeteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCompromiso" TIMESTAMP(3),
    "estado" "EstadoNC" NOT NULL DEFAULT 'ABIERTA',
    "evidenciaCierre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "no_conformidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acciones_nc" (
    "id" TEXT NOT NULL,
    "noConformidadId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoAccion" NOT NULL,
    "responsableId" TEXT NOT NULL,
    "fechaCompromiso" TIMESTAMP(3) NOT NULL,
    "fechaCierre" TIMESTAMP(3),
    "estado" "EstadoAccion" NOT NULL DEFAULT 'PENDIENTE',
    "evidenciaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acciones_nc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas_auditoria" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "programas_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" TEXT NOT NULL,
    "programaId" TEXT,
    "tipo" "TipoAuditoria" NOT NULL,
    "alcance" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "liderAuditorId" TEXT NOT NULL,
    "equipoAuditor" TEXT,
    "estado" "EstadoAuditoria" NOT NULL DEFAULT 'PROGRAMADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "auditoriaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas_checklist" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "respuesta" "RespuestaChecklist" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "evidenciaUrl" TEXT,

    CONSTRAINT "preguntas_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hallazgos" (
    "id" TEXT NOT NULL,
    "auditoriaId" TEXT NOT NULL,
    "tipo" "TipoHallazgo" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "procesoId" TEXT,
    "noConformidadId" TEXT,
    "responsableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hallazgos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informes_auditoria" (
    "id" TEXT NOT NULL,
    "auditoriaId" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "conclusiones" TEXT,
    "archivoUrl" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "informes_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "formula" TEXT,
    "frecuencia" "FrecuenciaIndicador" NOT NULL,
    "meta" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT,
    "direccion" "DireccionIndicador" NOT NULL DEFAULT 'MAYOR_ES_MEJOR',
    "procesoId" TEXT,
    "responsableId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "indicadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_indicador" (
    "id" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "capturadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_indicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "taxId" TEXT,
    "tipo" "TipoProveedor" NOT NULL,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "estado" "EstadoProveedor" NOT NULL DEFAULT 'EN_EVALUACION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_proveedor" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "puntuacion" DOUBLE PRECISION NOT NULL,
    "criterios" JSONB,
    "resultado" TEXT,
    "evaluadoPorId" TEXT NOT NULL,

    CONSTRAINT "evaluaciones_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_proveedor" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "entidadTipo" TEXT,
    "entidadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "asignadoAId" TEXT NOT NULL,
    "origenTipo" TEXT,
    "origenId" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_nombre_key" ON "areas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "personas_email_key" ON "personas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_personaId_key" ON "usuarios"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_nombre_key" ON "tipos_documento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_codigo_key" ON "documentos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_versionVigenteId_key" ON "documentos"("versionVigenteId");

-- CreateIndex
CREATE INDEX "documentos_estado_idx" ON "documentos"("estado");

-- CreateIndex
CREATE INDEX "documentos_areaId_idx" ON "documentos"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "versiones_documento_documentoId_numeroVersion_key" ON "versiones_documento"("documentoId", "numeroVersion");

-- CreateIndex
CREATE INDEX "actividades_estado_idx" ON "actividades"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_riesgo_nombre_key" ON "categorias_riesgo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "riesgos_codigo_key" ON "riesgos"("codigo");

-- CreateIndex
CREATE INDEX "riesgos_nivelRiesgo_idx" ON "riesgos"("nivelRiesgo");

-- CreateIndex
CREATE INDEX "riesgos_estado_idx" ON "riesgos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "no_conformidades_codigo_key" ON "no_conformidades"("codigo");

-- CreateIndex
CREATE INDEX "no_conformidades_estado_idx" ON "no_conformidades"("estado");

-- CreateIndex
CREATE INDEX "no_conformidades_origen_idx" ON "no_conformidades"("origen");

-- CreateIndex
CREATE INDEX "acciones_nc_estado_idx" ON "acciones_nc"("estado");

-- CreateIndex
CREATE INDEX "auditorias_estado_idx" ON "auditorias"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "hallazgos_noConformidadId_key" ON "hallazgos"("noConformidadId");

-- CreateIndex
CREATE UNIQUE INDEX "informes_auditoria_auditoriaId_key" ON "informes_auditoria"("auditoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "registros_indicador_indicadorId_fecha_key" ON "registros_indicador"("indicadorId", "fecha");

-- CreateIndex
CREATE INDEX "notificaciones_usuarioId_leida_idx" ON "notificaciones"("usuarioId", "leida");

-- CreateIndex
CREATE INDEX "tareas_asignadoAId_estado_idx" ON "tareas"("asignadoAId", "estado");

-- AddForeignKey
ALTER TABLE "puestos" ADD CONSTRAINT "puestos_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_puestoId_fkey" FOREIGN KEY ("puestoId") REFERENCES "puestos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_versionVigenteId_fkey" FOREIGN KEY ("versionVigenteId") REFERENCES "versiones_documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones_documento" ADD CONSTRAINT "versiones_documento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones_documento" ADD CONSTRAINT "versiones_documento_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones_documento" ADD CONSTRAINT "versiones_documento_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_lectura" ADD CONSTRAINT "evidencias_lectura_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_lectura" ADD CONSTRAINT "evidencias_lectura_versionDocumentoId_fkey" FOREIGN KEY ("versionDocumentoId") REFERENCES "versiones_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_lectura" ADD CONSTRAINT "evidencias_lectura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivos" ADD CONSTRAINT "objetivos_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivos" ADD CONSTRAINT "objetivos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes" ADD CONSTRAINT "planes_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "objetivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes" ADD CONSTRAINT "planes_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos" ADD CONSTRAINT "procesos_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos" ADD CONSTRAINT "procesos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riesgos" ADD CONSTRAINT "riesgos_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riesgos" ADD CONSTRAINT "riesgos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_riesgo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riesgos" ADD CONSTRAINT "riesgos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_tratamiento_riesgo" ADD CONSTRAINT "planes_tratamiento_riesgo_riesgoId_fkey" FOREIGN KEY ("riesgoId") REFERENCES "riesgos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_tratamiento_riesgo" ADD CONSTRAINT "planes_tratamiento_riesgo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_conformidades" ADD CONSTRAINT "no_conformidades_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_conformidades" ADD CONSTRAINT "no_conformidades_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones_nc" ADD CONSTRAINT "acciones_nc_noConformidadId_fkey" FOREIGN KEY ("noConformidadId") REFERENCES "no_conformidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones_nc" ADD CONSTRAINT "acciones_nc_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas_auditoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_liderAuditorId_fkey" FOREIGN KEY ("liderAuditorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "auditorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas_checklist" ADD CONSTRAINT "preguntas_checklist_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgos" ADD CONSTRAINT "hallazgos_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "auditorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgos" ADD CONSTRAINT "hallazgos_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgos" ADD CONSTRAINT "hallazgos_noConformidadId_fkey" FOREIGN KEY ("noConformidadId") REFERENCES "no_conformidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgos" ADD CONSTRAINT "hallazgos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informes_auditoria" ADD CONSTRAINT "informes_auditoria_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "auditorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores" ADD CONSTRAINT "indicadores_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores" ADD CONSTRAINT "indicadores_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_indicador" ADD CONSTRAINT "registros_indicador_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "indicadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_indicador" ADD CONSTRAINT "registros_indicador_capturadoPorId_fkey" FOREIGN KEY ("capturadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_proveedor" ADD CONSTRAINT "evaluaciones_proveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_proveedor" ADD CONSTRAINT "evaluaciones_proveedor_evaluadoPorId_fkey" FOREIGN KEY ("evaluadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_proveedor" ADD CONSTRAINT "documentos_proveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

