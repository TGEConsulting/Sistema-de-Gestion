import { prisma } from "../../lib/prisma";
import {
  esAccionVencida,
  esAuditoriaProxima,
  esCambioTransicionProxima,
  esDocumentoPorVencer,
  esIndicadorSinCaptura,
  esNCSinAtender,
} from "./alertas.utils";

interface AlertaParams {
  usuarioId: string;
  tipo: Parameters<typeof prisma.notificacion.create>[0]["data"]["tipo"];
  titulo: string;
  mensaje: string;
  entidadTipo: string;
  entidadId: string;
  fechaVencimiento?: Date;
}

/** Crea una notificación (si no hay una sin leer para la misma entidad) y una
 * tarea pendiente asociada (si no hay ya una tarea abierta para esa entidad),
 * para que aparezca tanto en el centro de notificaciones como en el tablero de tareas. */
async function emitirAlerta(params: AlertaParams) {
  const notificacionExistente = await prisma.notificacion.findFirst({
    where: {
      usuarioId: params.usuarioId,
      tipo: params.tipo,
      entidadTipo: params.entidadTipo,
      entidadId: params.entidadId,
      leida: false,
    },
  });
  if (!notificacionExistente) {
    await prisma.notificacion.create({
      data: {
        usuarioId: params.usuarioId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensaje: params.mensaje,
        entidadTipo: params.entidadTipo,
        entidadId: params.entidadId,
      },
    });
  }

  const tareaExistente = await prisma.tarea.findFirst({
    where: {
      asignadoAId: params.usuarioId,
      origenTipo: params.entidadTipo,
      origenId: params.entidadId,
      estado: { in: ["PENDIENTE", "EN_PROCESO"] },
    },
  });
  if (!tareaExistente) {
    await prisma.tarea.create({
      data: {
        titulo: params.titulo,
        descripcion: params.mensaje,
        asignadoAId: params.usuarioId,
        origenTipo: params.entidadTipo,
        origenId: params.entidadId,
        fechaVencimiento: params.fechaVencimiento,
      },
    });
  }
}

async function generarAlertasDocumentos(hoy: Date) {
  const documentos = await prisma.documento.findMany({
    where: { deletedAt: null, estado: { not: "OBSOLETO" } },
  });

  for (const doc of documentos) {
    if (esDocumentoPorVencer(doc.proximaRevision, hoy)) {
      await emitirAlerta({
        usuarioId: doc.responsableId,
        tipo: "DOCUMENTO_POR_VENCER",
        titulo: "Documento próximo a revisión",
        mensaje: `El documento "${doc.titulo}" (${doc.codigo}) requiere revisión pronto.`,
        entidadTipo: "Documento",
        entidadId: doc.id,
        fechaVencimiento: doc.proximaRevision ?? undefined,
      });
    }
  }
}

async function generarAlertasNoConformidades(hoy: Date) {
  const ncs = await prisma.noConformidad.findMany({ where: { deletedAt: null } });

  for (const nc of ncs) {
    if (esNCSinAtender(nc.estado, nc.fechaDeteccion, hoy)) {
      await emitirAlerta({
        usuarioId: nc.responsableId,
        tipo: "NC_SIN_ATENDER",
        titulo: "No conformidad sin atender",
        mensaje: `La NC "${nc.codigo}" sigue abierta sin acciones definidas.`,
        entidadTipo: "NoConformidad",
        entidadId: nc.id,
        fechaVencimiento: nc.fechaCompromiso ?? undefined,
      });
    }
  }
}

async function generarAlertasIndicadores(hoy: Date) {
  const indicadores = await prisma.indicador.findMany({
    where: { deletedAt: null, activo: true },
    include: { registros: { orderBy: { fecha: "desc" }, take: 1 } },
  });

  for (const ind of indicadores) {
    const ultimaCaptura = ind.registros[0]?.fecha ?? null;
    if (esIndicadorSinCaptura(ultimaCaptura, hoy, ind.frecuencia)) {
      await emitirAlerta({
        usuarioId: ind.responsableId,
        tipo: "INDICADOR_SIN_CAPTURA",
        titulo: "Indicador sin captura reciente",
        mensaje: `El indicador "${ind.nombre}" no tiene captura dentro del periodo esperado.`,
        entidadTipo: "Indicador",
        entidadId: ind.id,
      });
    }
  }
}

async function generarAlertasAuditorias(hoy: Date) {
  const auditorias = await prisma.auditoria.findMany({ where: { deletedAt: null } });

  for (const auditoria of auditorias) {
    if (esAuditoriaProxima(auditoria.fechaInicio, auditoria.estado, hoy)) {
      await emitirAlerta({
        usuarioId: auditoria.liderAuditorId,
        tipo: "AUDITORIA_PROXIMA",
        titulo: "Auditoría próxima",
        mensaje: `La auditoría "${auditoria.alcance}" inicia el ${auditoria.fechaInicio.toLocaleDateString("es-MX")}.`,
        entidadTipo: "Auditoria",
        entidadId: auditoria.id,
        fechaVencimiento: auditoria.fechaInicio,
      });
    }
  }
}

async function generarAlertasAccionesVencidas(hoy: Date) {
  const acciones = await prisma.accionNC.findMany({ where: { estado: { not: "COMPLETADA" } } });

  for (const accion of acciones) {
    if (esAccionVencida(accion.fechaCompromiso, accion.estado, hoy)) {
      if (accion.estado !== "VENCIDA") {
        await prisma.accionNC.update({ where: { id: accion.id }, data: { estado: "VENCIDA" } });
      }
      await emitirAlerta({
        usuarioId: accion.responsableId,
        tipo: "ACCION_VENCIDA",
        titulo: "Acción vencida",
        mensaje: `La acción "${accion.descripcion}" venció el ${accion.fechaCompromiso.toLocaleDateString("es-MX")}.`,
        entidadTipo: "AccionNC",
        entidadId: accion.id,
        fechaVencimiento: accion.fechaCompromiso,
      });
    }
  }
}

async function generarAlertasCambiosPorVencer(hoy: Date) {
  const cambios = await prisma.gestionCambio.findMany({
    where: { deletedAt: null, plazoTransicion: { not: null } },
  });
  if (cambios.length === 0) return;

  // El plazo de transición (requisito 4 de FSSC) es responsabilidad de calidad/auditoría,
  // no de un único "responsable" puntual como en el resto de las alertas: se avisa a todos
  // los usuarios con rol ADMIN o AUDITOR.
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true, deletedAt: null, rol: { nombre: { in: ["ADMIN", "AUDITOR"] } } },
  });

  for (const cambio of cambios) {
    if (!esCambioTransicionProxima(cambio.plazoTransicion, cambio.estado, hoy)) continue;

    for (const usuario of usuarios) {
      await emitirAlerta({
        usuarioId: usuario.id,
        tipo: "CAMBIO_TRANSICION_PROXIMA",
        titulo: "Plazo de transición próximo a vencer",
        mensaje: `El cambio "${cambio.titulo}" (${cambio.codigo}) tiene plazo de transición el ${cambio.plazoTransicion!.toLocaleDateString("es-MX")}.`,
        entidadTipo: "GestionCambio",
        entidadId: cambio.id,
        fechaVencimiento: cambio.plazoTransicion ?? undefined,
      });
    }
  }
}

/** Punto de entrada único, pensado para invocarse desde un cron diario. */
export async function generarAlertas(hoy: Date = new Date()) {
  await Promise.all([
    generarAlertasDocumentos(hoy),
    generarAlertasNoConformidades(hoy),
    generarAlertasIndicadores(hoy),
    generarAlertasAuditorias(hoy),
    generarAlertasAccionesVencidas(hoy),
    generarAlertasCambiosPorVencer(hoy),
  ]);
}
