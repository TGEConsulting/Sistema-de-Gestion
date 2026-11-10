import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginatedResult, paginationArgs } from "../../utils/pagination";
import type {
  ActualizarInterfazInput,
  CrearInterfazInput,
  ListarInterfacesQuery,
  RevisarInterfazInput,
} from "./matriz.validators";

const DETALLE_INCLUDE = {
  areaDuena: { select: { id: true, nombre: true } },
  areaContraparte: { select: { id: true, nombre: true } },
};

function construirWhere(filtros: Omit<ListarInterfacesQuery, "page" | "pageSize">) {
  return {
    deletedAt: null,
    ...(filtros.areaId ? { OR: [{ areaDuenaId: filtros.areaId }, { areaContraparteId: filtros.areaId }] } : {}),
    ...(filtros.areaDuenaId ? { areaDuenaId: filtros.areaDuenaId } : {}),
    ...(filtros.areaContraparteId ? { areaContraparteId: filtros.areaContraparteId } : {}),
    ...(filtros.documentoCodigo ? { documentoCodigo: filtros.documentoCodigo } : {}),
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.q
      ? {
          AND: [
            {
              OR: [
                { documentoCodigo: { contains: filtros.q, mode: "insensitive" as const } },
                { contraparteTexto: { contains: filtros.q, mode: "insensitive" as const } },
                { entrega: { contains: filtros.q, mode: "insensitive" as const } },
                { recibe: { contains: filtros.q, mode: "insensitive" as const } },
              ],
            },
          ],
        }
      : {}),
  };
}

const ORDER = [{ documentoCodigo: "asc" as const }, { contraparteTexto: "asc" as const }];

export async function listarParaExportar(filtros: Omit<ListarInterfacesQuery, "page" | "pageSize">) {
  return prisma.comunicacionInterfaz.findMany({ where: construirWhere(filtros), include: DETALLE_INCLUDE, orderBy: ORDER, take: 5000 });
}

export async function listarInterfaces(filtros: ListarInterfacesQuery) {
  const where = construirWhere(filtros);
  const [data, total] = await Promise.all([
    prisma.comunicacionInterfaz.findMany({ where, include: DETALLE_INCLUDE, orderBy: ORDER, ...paginationArgs(filtros) }),
    prisma.comunicacionInterfaz.count({ where }),
  ]);
  return buildPaginatedResult(data, total, filtros);
}

/** Resumen por gerencia: cuántas interfaces emite/recibe y cuántas están aceptadas. */
export async function resumenPorArea() {
  const areas = await prisma.area.findMany({ where: { deletedAt: null }, orderBy: { nombre: "asc" } });
  const filas = await prisma.comunicacionInterfaz.findMany({ where: { deletedAt: null }, select: { areaDuenaId: true, areaContraparteId: true, estado: true } });
  return areas.map((a) => {
    const mias = filas.filter((f) => f.areaDuenaId === a.id || f.areaContraparteId === a.id);
    return {
      areaId: a.id,
      area: a.nombre,
      total: mias.length,
      comoDuena: mias.filter((f) => f.areaDuenaId === a.id).length,
      comoContraparte: mias.filter((f) => f.areaContraparteId === a.id).length,
      aceptadas: mias.filter((f) => f.estado === "ACEPTADA").length,
      pendientes: mias.filter((f) => f.estado === "PROPUESTA").length,
      conAjuste: mias.filter((f) => f.estado === "CON_AJUSTE" || f.estado === "RECHAZADA").length,
    };
  });
}

export async function obtenerInterfaz(id: string) {
  const r = await prisma.comunicacionInterfaz.findFirst({ where: { id, deletedAt: null }, include: DETALLE_INCLUDE });
  if (!r) throw AppError.notFound("Interfaz no encontrada");
  return r;
}

export async function crearInterfaz(input: CrearInterfazInput) {
  return prisma.comunicacionInterfaz.create({ data: input, include: DETALLE_INCLUDE });
}

export async function actualizarInterfaz(id: string, input: ActualizarInterfazInput) {
  await obtenerInterfaz(id);
  return prisma.comunicacionInterfaz.update({ where: { id }, data: input, include: DETALLE_INCLUDE });
}

/** La gerencia contraparte acepta, pide ajuste o rechaza la interfaz (revisión cruzada T20). */
export async function revisarInterfaz(id: string, input: RevisarInterfazInput) {
  await obtenerInterfaz(id);
  if (input.estado !== "ACEPTADA" && !input.observacion) {
    throw AppError.badRequest("Para pedir ajuste o rechazar la interfaz hay que indicar la observación");
  }
  return prisma.comunicacionInterfaz.update({ where: { id }, data: { estado: input.estado, observacion: input.observacion }, include: DETALLE_INCLUDE });
}

export async function eliminarInterfaz(id: string) {
  await obtenerInterfaz(id);
  await prisma.comunicacionInterfaz.update({ where: { id }, data: { deletedAt: new Date() } });
}
