import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { calcularNivelRiesgo } from "./riesgo.utils";
import { buildPaginatedResult, paginationArgs } from "../../utils/pagination";
import type {
  ActualizarRiesgoInput,
  CrearRiesgoInput,
  ListarRiesgosQuery,
} from "./riesgos.validators";

const DETALLE_INCLUDE = {
  proceso: { include: { area: true } },
  categoria: true,
  responsable: { select: { id: true, nombre: true } },
  planesTratamiento: {
    include: { responsable: { select: { id: true, nombre: true } } },
    orderBy: { fechaCompromiso: "asc" as const },
  },
};

function construirWhereRiesgos(filtros: Omit<ListarRiesgosQuery, "page" | "pageSize">) {
  return {
    deletedAt: null,
    ...(filtros.procesoId ? { procesoId: filtros.procesoId } : {}),
    ...(filtros.categoriaId ? { categoriaId: filtros.categoriaId } : {}),
    ...(filtros.nivelRiesgo ? { nivelRiesgo: filtros.nivelRiesgo as never } : {}),
    ...(filtros.estado ? { estado: filtros.estado as never } : {}),
  };
}

export async function listarRiesgosParaExportar(
  filtros: Omit<ListarRiesgosQuery, "page" | "pageSize">
) {
  return prisma.riesgo.findMany({
    where: construirWhereRiesgos(filtros),
    include: {
      proceso: true,
      categoria: true,
      responsable: { select: { id: true, nombre: true } },
    },
    orderBy: [{ puntajeRiesgo: "desc" }, { updatedAt: "desc" }],
    take: 5000,
  });
}

export async function listarRiesgos(filtros: ListarRiesgosQuery) {
  const where = construirWhereRiesgos(filtros);

  const [data, total] = await Promise.all([
    prisma.riesgo.findMany({
      where,
      include: {
        proceso: true,
        categoria: true,
        responsable: { select: { id: true, nombre: true } },
      },
      orderBy: [{ puntajeRiesgo: "desc" }, { updatedAt: "desc" }],
      ...paginationArgs(filtros),
    }),
    prisma.riesgo.count({ where }),
  ]);

  return buildPaginatedResult(data, total, filtros);
}

export async function obtenerRiesgo(id: string) {
  const riesgo = await prisma.riesgo.findFirst({
    where: { id, deletedAt: null },
    include: DETALLE_INCLUDE,
  });
  if (!riesgo) throw AppError.notFound("Riesgo no encontrado");
  return riesgo;
}

export async function crearRiesgo(input: CrearRiesgoInput) {
  const existente = await prisma.riesgo.findUnique({ where: { codigo: input.codigo } });
  if (existente) throw AppError.conflict("Ya existe un riesgo con ese código");

  const { puntaje, nivel } = calcularNivelRiesgo(input.probabilidad, input.impacto);

  return prisma.riesgo.create({
    data: { ...input, puntajeRiesgo: puntaje, nivelRiesgo: nivel },
  });
}

export async function actualizarRiesgo(id: string, input: ActualizarRiesgoInput) {
  const riesgo = await obtenerRiesgo(id);

  const probabilidad = input.probabilidad ?? riesgo.probabilidad;
  const impacto = input.impacto ?? riesgo.impacto;
  const { puntaje, nivel } = calcularNivelRiesgo(probabilidad, impacto);

  return prisma.riesgo.update({
    where: { id },
    data: { ...input, probabilidad, impacto, puntajeRiesgo: puntaje, nivelRiesgo: nivel },
  });
}

export async function eliminarRiesgo(id: string) {
  await obtenerRiesgo(id);
  await prisma.riesgo.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function agregarTratamiento(
  riesgoId: string,
  input: { descripcion: string; responsableId: string; fechaCompromiso: Date }
) {
  await obtenerRiesgo(riesgoId);
  const tratamiento = await prisma.planTratamientoRiesgo.create({
    data: { riesgoId, ...input },
  });
  await prisma.riesgo.update({ where: { id: riesgoId }, data: { estado: "EN_TRATAMIENTO" } });
  return tratamiento;
}

export async function actualizarTratamiento(
  id: string,
  input: Partial<{
    descripcion: string;
    responsableId: string;
    fechaCompromiso: Date;
    estado: "PENDIENTE" | "EN_PROCESO" | "IMPLEMENTADO" | "VERIFICADO";
    evidenciaUrl: string;
  }>
) {
  const tratamiento = await prisma.planTratamientoRiesgo.findUnique({ where: { id } });
  if (!tratamiento) throw AppError.notFound("Plan de tratamiento no encontrado");

  const actualizado = await prisma.planTratamientoRiesgo.update({ where: { id }, data: input });

  if (input.estado === "VERIFICADO") {
    const pendientes = await prisma.planTratamientoRiesgo.count({
      where: { riesgoId: tratamiento.riesgoId, estado: { not: "VERIFICADO" } },
    });
    if (pendientes === 0) {
      await prisma.riesgo.update({ where: { id: tratamiento.riesgoId }, data: { estado: "MITIGADO" } });
    }
  }

  return actualizado;
}
