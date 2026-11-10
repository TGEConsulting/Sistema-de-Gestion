import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginatedResult, paginationArgs } from "../../utils/pagination";
import type {
  ActualizarRequisitoInput,
  CrearRequisitoInput,
  EvaluarRequisitoInput,
  ListarRequisitosQuery,
} from "./requisitos.validators";

const DETALLE_INCLUDE = {
  area: { select: { id: true, nombre: true } },
  responsable: { select: { id: true, nombre: true } },
};

function construirWhere(filtros: Omit<ListarRequisitosQuery, "page" | "pageSize">) {
  return {
    deletedAt: null,
    ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.sistema ? { sistema: { contains: filtros.sistema, mode: "insensitive" as const } } : {}),
    ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
    ...(filtros.responsableId ? { responsableId: filtros.responsableId } : {}),
    ...(filtros.q
      ? {
          OR: [
            { requisito: { contains: filtros.q, mode: "insensitive" as const } },
            { fuente: { contains: filtros.q, mode: "insensitive" as const } },
            { documentos: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function listarRequisitosParaExportar(filtros: Omit<ListarRequisitosQuery, "page" | "pageSize">) {
  return prisma.requisito.findMany({
    where: construirWhere(filtros),
    include: DETALLE_INCLUDE,
    orderBy: [{ tipo: "asc" }, { sistema: "asc" }, { requisito: "asc" }],
    take: 5000,
  });
}

export async function listarRequisitos(filtros: ListarRequisitosQuery) {
  const where = construirWhere(filtros);
  const [data, total] = await Promise.all([
    prisma.requisito.findMany({
      where,
      include: DETALLE_INCLUDE,
      orderBy: [{ tipo: "asc" }, { sistema: "asc" }, { requisito: "asc" }],
      ...paginationArgs(filtros),
    }),
    prisma.requisito.count({ where }),
  ]);
  return buildPaginatedResult(data, total, filtros);
}

/** Resumen para el tablero: cuántos requisitos hay por estado y por tipo. */
export async function resumenRequisitos() {
  const [porEstado, porTipo] = await Promise.all([
    prisma.requisito.groupBy({ by: ["estado"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.requisito.groupBy({ by: ["tipo"], where: { deletedAt: null }, _count: { _all: true } }),
  ]);
  return {
    porEstado: Object.fromEntries(porEstado.map((r) => [r.estado, r._count._all])),
    porTipo: Object.fromEntries(porTipo.map((r) => [r.tipo, r._count._all])),
  };
}

export async function obtenerRequisito(id: string) {
  const r = await prisma.requisito.findFirst({ where: { id, deletedAt: null }, include: DETALLE_INCLUDE });
  if (!r) throw AppError.notFound("Requisito no encontrado");
  return r;
}

export async function crearRequisito(input: CrearRequisitoInput) {
  return prisma.requisito.create({ data: input, include: DETALLE_INCLUDE });
}

export async function actualizarRequisito(id: string, input: ActualizarRequisitoInput) {
  await obtenerRequisito(id);
  return prisma.requisito.update({ where: { id }, data: input, include: DETALLE_INCLUDE });
}

/** Registra el resultado de la evaluación de cumplimiento (9.1.2). */
export async function evaluarRequisito(id: string, input: EvaluarRequisitoInput) {
  await obtenerRequisito(id);
  return prisma.requisito.update({
    where: { id },
    data: {
      estado: input.estado,
      evidencia: input.evidencia,
      // si no se indica, la siguiente evaluación es en 12 meses
      proximaEvaluacion: input.proximaEvaluacion ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    include: DETALLE_INCLUDE,
  });
}

export async function eliminarRequisito(id: string) {
  await obtenerRequisito(id);
  await prisma.requisito.update({ where: { id }, data: { deletedAt: new Date() } });
}
