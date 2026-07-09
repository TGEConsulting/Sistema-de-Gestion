import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { buildPaginatedResult, paginationArgs } from "@/utils/pagination";
import type {
  ActualizarPersonaInput,
  CrearPersonaInput,
  ListarPersonasQuery,
} from "@/modules/personas/personas.validators";

export async function listarPersonas(filtros: ListarPersonasQuery) {
  const where = {
    deletedAt: null,
    ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
    ...(filtros.puestoId ? { puestoId: filtros.puestoId } : {}),
    ...(filtros.activo !== undefined ? { activo: filtros.activo } : {}),
    ...(filtros.q
      ? {
          OR: [
            { nombre: { contains: filtros.q, mode: "insensitive" as const } },
            { apellido: { contains: filtros.q, mode: "insensitive" as const } },
            { email: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.persona.findMany({
      where,
      include: { area: true, puesto: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      ...paginationArgs(filtros),
    }),
    prisma.persona.count({ where }),
  ]);

  return buildPaginatedResult(data, total, filtros);
}

export async function obtenerPersona(id: string) {
  const persona = await prisma.persona.findFirst({
    where: { id, deletedAt: null },
    include: { area: true, puesto: true, usuario: { select: { id: true, email: true } } },
  });
  if (!persona) throw AppError.notFound("Persona no encontrada");
  return persona;
}

export async function crearPersona(input: CrearPersonaInput) {
  return prisma.persona.create({ data: input });
}

export async function actualizarPersona(id: string, input: ActualizarPersonaInput) {
  await obtenerPersona(id);
  return prisma.persona.update({ where: { id }, data: input });
}

export async function eliminarPersona(id: string) {
  await obtenerPersona(id);
  await prisma.persona.update({
    where: { id },
    data: { deletedAt: new Date(), activo: false },
  });
}
