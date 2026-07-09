import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  ActualizarAreaInput,
  CrearAreaInput,
} from "./areas.validators";

export async function listarAreas(filtros: { activo?: boolean; q?: string }) {
  return prisma.area.findMany({
    where: {
      deletedAt: null,
      ...(filtros.activo !== undefined ? { activo: filtros.activo } : {}),
      ...(filtros.q ? { nombre: { contains: filtros.q, mode: "insensitive" } } : {}),
    },
    orderBy: { nombre: "asc" },
  });
}

export async function obtenerArea(id: string) {
  const area = await prisma.area.findFirst({ where: { id, deletedAt: null } });
  if (!area) throw AppError.notFound("Área no encontrada");
  return area;
}

export async function crearArea(input: CrearAreaInput) {
  return prisma.area.create({ data: input });
}

export async function actualizarArea(id: string, input: ActualizarAreaInput) {
  await obtenerArea(id);
  return prisma.area.update({ where: { id }, data: input });
}

export async function eliminarArea(id: string) {
  await obtenerArea(id);
  await prisma.area.update({ where: { id }, data: { deletedAt: new Date(), activo: false } });
}
