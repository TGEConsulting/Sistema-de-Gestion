import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando roles...");
  const [rolAdmin, rolAuditor, rolResponsable, rolLectura] = await Promise.all([
    prisma.rol.upsert({
      where: { nombre: "ADMIN" },
      update: {},
      create: { nombre: "ADMIN", descripcion: "Administrador del sistema, acceso total" },
    }),
    prisma.rol.upsert({
      where: { nombre: "AUDITOR" },
      update: {},
      create: { nombre: "AUDITOR", descripcion: "Planea y ejecuta auditorías, registra hallazgos" },
    }),
    prisma.rol.upsert({
      where: { nombre: "RESPONSABLE_PROCESO" },
      update: {},
      create: {
        nombre: "RESPONSABLE_PROCESO",
        descripcion: "Responsable de documentos, riesgos, NC e indicadores de su proceso",
      },
    }),
    prisma.rol.upsert({
      where: { nombre: "LECTURA" },
      update: {},
      create: { nombre: "LECTURA", descripcion: "Solo consulta" },
    }),
  ]);

  console.log("Sembrando matriz de permisos por módulo...");
  const MODULOS: Array<
    "DOCUMENTOS" | "OBJETIVOS" | "RIESGOS" | "NO_CONFORMIDADES" | "AUDITORIAS" | "INDICADORES" | "PERSONAS" | "PROVEEDORES" | "COMUNICACIONES" | "GESTION_CAMBIOS"
  > = [
    "DOCUMENTOS",
    "OBJETIVOS",
    "RIESGOS",
    "NO_CONFORMIDADES",
    "AUDITORIAS",
    "INDICADORES",
    "PERSONAS",
    "PROVEEDORES",
    "COMUNICACIONES",
    "GESTION_CAMBIOS",
  ];

  const APROBAR_AUDITOR = new Set(["AUDITORIAS", "NO_CONFORMIDADES", "DOCUMENTOS", "GESTION_CAMBIOS"]);
  const EDITAR_AUDITOR = new Set(["PROVEEDORES"]);
  const EDITAR_RESPONSABLE = new Set([
    "DOCUMENTOS",
    "OBJETIVOS",
    "RIESGOS",
    "NO_CONFORMIDADES",
    "INDICADORES",
    "PROVEEDORES",
    "GESTION_CAMBIOS",
  ]);

  const permisosDefault: Array<{ rolId: string; modulo: (typeof MODULOS)[number]; nivel: "VER" | "EDITAR" | "APROBAR" }> = [];
  for (const modulo of MODULOS) {
    permisosDefault.push({ rolId: rolAdmin.id, modulo, nivel: "APROBAR" });
    permisosDefault.push({
      rolId: rolAuditor.id,
      modulo,
      nivel: APROBAR_AUDITOR.has(modulo) ? "APROBAR" : EDITAR_AUDITOR.has(modulo) ? "EDITAR" : "VER",
    });
    permisosDefault.push({
      rolId: rolResponsable.id,
      modulo,
      nivel: EDITAR_RESPONSABLE.has(modulo) ? "EDITAR" : "VER",
    });
    permisosDefault.push({ rolId: rolLectura.id, modulo, nivel: "VER" });
  }

  for (const permiso of permisosDefault) {
    await prisma.permisoModulo.upsert({
      where: { rolId_modulo: { rolId: permiso.rolId, modulo: permiso.modulo } },
      update: {},
      create: permiso,
    });
  }

  console.log("Sembrando áreas y puestos...");
  const areaCalidad = await prisma.area.upsert({
    where: { nombre: "Calidad" },
    update: {},
    create: { nombre: "Calidad", descripcion: "Aseguramiento de calidad y sistemas de gestión" },
  });
  const areaProduccion = await prisma.area.upsert({
    where: { nombre: "Producción" },
    update: {},
    create: { nombre: "Producción", descripcion: "Planta y operaciones" },
  });

  const puestoCoordCalidad = await prisma.puesto.create({
    data: { nombre: "Coordinador de Calidad", areaId: areaCalidad.id },
  });

  console.log("Sembrando persona y usuario administrador...");
  const personaAdmin = await prisma.persona.create({
    data: {
      nombre: "Admin",
      apellido: "Sistema",
      email: "admin@gestion-sgc.local",
      puestoId: puestoCoordCalidad.id,
      areaId: areaCalidad.id,
    },
  });

  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const usuarioAdmin = await prisma.usuario.upsert({
    where: { email: "admin@gestion-sgc.local" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@gestion-sgc.local",
      passwordHash,
      rolId: rolAdmin.id,
      personaId: personaAdmin.id,
    },
  });

  console.log("Sembrando catálogos base...");
  const tipoPolitica = await prisma.tipoDocumento.upsert({
    where: { nombre: "Política" },
    update: {},
    create: { nombre: "Política" },
  });
  const tipoProcedimiento = await prisma.tipoDocumento.upsert({
    where: { nombre: "Procedimiento" },
    update: {},
    create: { nombre: "Procedimiento" },
  });

  const categoriaOperativo = await prisma.categoriaRiesgo.upsert({
    where: { nombre: "Operativo" },
    update: {},
    create: { nombre: "Operativo" },
  });

  const procesoProduccion = await prisma.proceso.create({
    data: { nombre: "Producción de línea 1", areaId: areaProduccion.id, responsableId: usuarioAdmin.id },
  });

  console.log("Sembrando datos de ejemplo...");
  const proximaRevision = new Date();
  proximaRevision.setDate(proximaRevision.getDate() + 15);

  await prisma.documento.create({
    data: {
      codigo: "POL-001",
      titulo: "Política de Calidad",
      tipoDocumentoId: tipoPolitica.id,
      areaId: areaCalidad.id,
      responsableId: usuarioAdmin.id,
      estado: "APROBADO",
      proximaRevision,
    },
  });

  await prisma.documento.create({
    data: {
      codigo: "PRO-010",
      titulo: "Procedimiento de Control de Documentos",
      tipoDocumentoId: tipoProcedimiento.id,
      areaId: areaCalidad.id,
      responsableId: usuarioAdmin.id,
      estado: "BORRADOR",
    },
  });

  await prisma.riesgo.create({
    data: {
      codigo: "RSG-001",
      descripcion: "Contaminación cruzada en línea de empaque",
      procesoId: procesoProduccion.id,
      categoriaId: categoriaOperativo.id,
      probabilidad: 3,
      impacto: 4,
      puntajeRiesgo: 12,
      nivelRiesgo: "ALTO",
      responsableId: usuarioAdmin.id,
      estado: "IDENTIFICADO",
    },
  });

  const fechaDeteccion = new Date();
  fechaDeteccion.setDate(fechaDeteccion.getDate() - 10);
  await prisma.noConformidad.create({
    data: {
      codigo: "NC-001",
      origen: "AUDITORIA",
      descripcion: "Registro de temperatura incompleto en cámara fría",
      procesoId: procesoProduccion.id,
      responsableId: usuarioAdmin.id,
      fechaDeteccion,
      estado: "ABIERTA",
    },
  });

  await prisma.indicador.create({
    data: {
      nombre: "% Cumplimiento de auditorías internas",
      frecuencia: "MENSUAL",
      meta: 95,
      unidad: "%",
      direccion: "MAYOR_ES_MEJOR",
      procesoId: procesoProduccion.id,
      responsableId: usuarioAdmin.id,
    },
  });

  const fechaAuditoria = new Date();
  fechaAuditoria.setDate(fechaAuditoria.getDate() + 10);
  await prisma.auditoria.create({
    data: {
      tipo: "INTERNA",
      alcance: "Sistema de Gestión de Calidad - Planta 1",
      fechaInicio: fechaAuditoria,
      fechaFin: fechaAuditoria,
      liderAuditorId: usuarioAdmin.id,
      estado: "PROGRAMADA",
    },
  });

  await prisma.proveedor.create({
    data: {
      nombre: "Insumos del Bajío S.A. de C.V.",
      tipo: "INSUMOS",
      estado: "ACTIVO",
      email: "contacto@insumosdelbajio.mx",
    },
  });

  console.log("Seed completado. Usuario admin: admin@gestion-sgc.local / Admin123!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
