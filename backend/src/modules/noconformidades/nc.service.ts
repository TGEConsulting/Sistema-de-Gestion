import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginatedResult, paginationArgs } from "../../utils/pagination";
import type {
  ActualizarNCInput,
  CrearAccionInput,
  CrearNCInput,
  ListarNCQuery,
} from "./nc.validators";

const DETALLE_INCLUDE = {
  proceso: true,
  responsable: { select: { id: true, nombre: true } },
  acciones: {
    include: { responsable: { select: { id: true, nombre: true } } },
    orderBy: { fechaCompromiso: "asc" as const },
  },
};

function construirWhereNC(filtros: Omit<ListarNCQuery, "page" | "pageSize">) {
  return {
    deletedAt: null,
    ...(filtros.estado ? { estado: filtros.estado as never } : {}),
    ...(filtros.origen ? { origen: filtros.origen as never } : {}),
    ...(filtros.procesoId ? { procesoId: filtros.procesoId } : {}),
    ...(filtros.responsableId ? { responsableId: filtros.responsableId } : {}),
  };
}

export async function listarNCParaExportar(filtros: Omit<ListarNCQuery, "page" | "pageSize">) {
  return prisma.noConformidad.findMany({
    where: construirWhereNC(filtros),
    include: { proceso: true, responsable: { select: { id: true, nombre: true } } },
    orderBy: { fechaDeteccion: "desc" },
    take: 5000,
  });
}

export async function listarNC(filtros: ListarNCQuery) {
  const where = construirWhereNC(filtros);

  const [data, total] = await Promise.all([
    prisma.noConformidad.findMany({
      where,
      include: { proceso: true, responsable: { select: { id: true, nombre: true } } },
      orderBy: { fechaDeteccion: "desc" },
      ...paginationArgs(filtros),
    }),
    prisma.noConformidad.count({ where }),
  ]);

  return buildPaginatedResult(data, total, filtros);
}

export async function obtenerNC(id: string) {
  const nc = await prisma.noConformidad.findFirst({
    where: { id, deletedAt: null },
    include: DETALLE_INCLUDE,
  });
  if (!nc) throw AppError.notFound("No conformidad no encontrada");
  return nc;
}

export async function crearNC(input: CrearNCInput) {
  const existente = await prisma.noConformidad.findUnique({ where: { codigo: input.codigo } });
  if (existente) throw AppError.conflict("Ya existe una NC con ese código");

  return prisma.noConformidad.create({ data: { ...input, estado: "ABIERTA" } });
}

export async function actualizarNC(id: string, input: ActualizarNCInput) {
  await obtenerNC(id);
  return prisma.noConformidad.update({ where: { id }, data: input });
}

export async function eliminarNC(id: string) {
  await obtenerNC(id);
  await prisma.noConformidad.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function cerrarNC(id: string, evidenciaCierre: string) {
  const nc = await obtenerNC(id);
  const accionesSinCompletar = nc.acciones.filter((a) => a.estado !== "COMPLETADA");
  if (nc.acciones.length === 0) {
    throw AppError.badRequest("No se puede cerrar una NC sin acciones definidas");
  }
  if (accionesSinCompletar.length > 0) {
    throw AppError.badRequest("Todas las acciones deben estar completadas antes de cerrar la NC");
  }

  return prisma.noConformidad.update({
    where: { id },
    data: { estado: "CERRADA", evidenciaCierre },
  });
}

export async function agregarAccion(noConformidadId: string, input: CrearAccionInput) {
  const nc = await obtenerNC(noConformidadId);

  const accion = await prisma.accionNC.create({
    data: { noConformidadId, ...input },
  });

  if (nc.estado === "ABIERTA" || nc.estado === "EN_ANALISIS") {
    await prisma.noConformidad.update({
      where: { id: noConformidadId },
      data: { estado: "ACCION_DEFINIDA" },
    });
  }

  return accion;
}

export async function actualizarAccion(
  id: string,
  input: Partial<{
    descripcion: string;
    tipo: "INMEDIATA" | "CORRECTIVA" | "PREVENTIVA";
    responsableId: string;
    fechaCompromiso: Date;
    estado: "PENDIENTE" | "EN_PROCESO" | "COMPLETADA" | "VENCIDA";
    evidenciaUrl: string;
  }>
) {
  const accion = await prisma.accionNC.findUnique({ where: { id } });
  if (!accion) throw AppError.notFound("Acción no encontrada");

  const data = { ...input, fechaCierre: input.estado === "COMPLETADA" ? new Date() : undefined };
  const actualizada = await prisma.accionNC.update({ where: { id }, data });

  if (input.estado === "EN_PROCESO" || input.estado === "COMPLETADA") {
    const nc = await prisma.noConformidad.findUnique({ where: { id: accion.noConformidadId } });
    if (nc && (nc.estado === "ACCION_DEFINIDA" || nc.estado === "ABIERTA")) {
      await prisma.noConformidad.update({
        where: { id: accion.noConformidadId },
        data: { estado: "EN_IMPLEMENTACION" },
      });
    }
  }

  return actualizada;
}
