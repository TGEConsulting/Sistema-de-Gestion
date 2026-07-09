import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type {
  ActualizarObjetivoInput,
  CrearObjetivoInput,
} from "@/modules/objetivos/objetivos.validators";

export async function listarObjetivos(filtros: { areaId?: string; estado?: string; tipo?: string }) {
  return prisma.objetivo.findMany({
    where: {
      deletedAt: null,
      ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
      ...(filtros.estado ? { estado: filtros.estado as never } : {}),
      ...(filtros.tipo ? { tipo: filtros.tipo as never } : {}),
    },
    include: {
      area: true,
      responsable: { select: { id: true, nombre: true } },
      planes: { include: { actividades: true } },
    },
    orderBy: { fechaInicio: "desc" },
  });
}

export async function obtenerObjetivo(id: string) {
  const objetivo = await prisma.objetivo.findFirst({
    where: { id, deletedAt: null },
    include: {
      area: true,
      responsable: { select: { id: true, nombre: true } },
      planes: {
        include: {
          responsable: { select: { id: true, nombre: true } },
          actividades: { include: { responsable: { select: { id: true, nombre: true } } } },
        },
      },
    },
  });
  if (!objetivo) throw AppError.notFound("Objetivo no encontrado");
  return objetivo;
}

export async function crearObjetivo(input: CrearObjetivoInput) {
  return prisma.objetivo.create({ data: input });
}

export async function actualizarObjetivo(id: string, input: ActualizarObjetivoInput) {
  await obtenerObjetivo(id);
  return prisma.objetivo.update({ where: { id }, data: input });
}

export async function eliminarObjetivo(id: string) {
  await obtenerObjetivo(id);
  await prisma.objetivo.update({ where: { id }, data: { deletedAt: new Date() } });
}
