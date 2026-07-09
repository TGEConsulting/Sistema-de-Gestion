import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  ActualizarPuestoInput,
  CrearPuestoInput,
} from "./puestos.validators";

export async function listarPuestos(filtros: { areaId?: string; activo?: boolean }) {
  return prisma.puesto.findMany({
    where: {
      deletedAt: null,
      ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
      ...(filtros.activo !== undefined ? { activo: filtros.activo } : {}),
    },
    include: { area: true },
    orderBy: { nombre: "asc" },
  });
}

export async function obtenerPuesto(id: string) {
  const puesto = await prisma.puesto.findFirst({
    where: { id, deletedAt: null },
    include: { area: true },
  });
  if (!puesto) throw AppError.notFound("Puesto no encontrado");
  return puesto;
}

export async function crearPuesto(input: CrearPuestoInput) {
  return prisma.puesto.create({ data: input });
}

export async function actualizarPuesto(id: string, input: ActualizarPuestoInput) {
  await obtenerPuesto(id);
  return prisma.puesto.update({ where: { id }, data: input });
}

export async function eliminarPuesto(id: string) {
  await obtenerPuesto(id);
  await prisma.puesto.update({ where: { id }, data: { deletedAt: new Date(), activo: false } });
}
