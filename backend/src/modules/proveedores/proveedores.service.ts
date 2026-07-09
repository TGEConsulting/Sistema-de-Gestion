import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginatedResult, paginationArgs } from "../../utils/pagination";
import type {
  ActualizarProveedorInput,
  CrearDocumentoProveedorInput,
  CrearEvaluacionInput,
  CrearProveedorInput,
  ListarProveedoresQuery,
} from "./proveedores.validators";

const DETALLE_INCLUDE = {
  evaluaciones: {
    include: { evaluadoPor: { select: { id: true, nombre: true } } },
    orderBy: { fecha: "desc" as const },
  },
  documentos: { orderBy: { createdAt: "desc" as const } },
};

function estadoSegunPuntuacion(puntuacion: number): "ACTIVO" | "EN_EVALUACION" | "SUSPENDIDO" {
  if (puntuacion >= 70) return "ACTIVO";
  if (puntuacion >= 50) return "EN_EVALUACION";
  return "SUSPENDIDO";
}

export async function listarProveedores(filtros: ListarProveedoresQuery) {
  const where = {
    deletedAt: null,
    ...(filtros.tipo ? { tipo: filtros.tipo as never } : {}),
    ...(filtros.estado ? { estado: filtros.estado as never } : {}),
    ...(filtros.q ? { nombre: { contains: filtros.q, mode: "insensitive" as const } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.proveedor.findMany({ where, orderBy: { nombre: "asc" }, ...paginationArgs(filtros) }),
    prisma.proveedor.count({ where }),
  ]);

  return buildPaginatedResult(data, total, filtros);
}

export async function obtenerProveedor(id: string) {
  const proveedor = await prisma.proveedor.findFirst({
    where: { id, deletedAt: null },
    include: DETALLE_INCLUDE,
  });
  if (!proveedor) throw AppError.notFound("Proveedor no encontrado");
  return proveedor;
}

export async function crearProveedor(input: CrearProveedorInput) {
  return prisma.proveedor.create({ data: { ...input, estado: "EN_EVALUACION" } });
}

export async function actualizarProveedor(id: string, input: ActualizarProveedorInput) {
  await obtenerProveedor(id);
  return prisma.proveedor.update({ where: { id }, data: input });
}

export async function eliminarProveedor(id: string) {
  await obtenerProveedor(id);
  await prisma.proveedor.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function agregarEvaluacion(
  proveedorId: string,
  input: CrearEvaluacionInput,
  evaluadoPorId: string
) {
  await obtenerProveedor(proveedorId);
  const nuevoEstado = estadoSegunPuntuacion(input.puntuacion);

  return prisma.$transaction(async (tx) => {
    const evaluacion = await tx.evaluacionProveedor.create({
      data: { proveedorId, evaluadoPorId, ...input },
    });
    await tx.proveedor.update({ where: { id: proveedorId }, data: { estado: nuevoEstado } });
    return evaluacion;
  });
}

export async function agregarDocumento(proveedorId: string, input: CrearDocumentoProveedorInput) {
  await obtenerProveedor(proveedorId);
  return prisma.documentoProveedor.create({ data: { proveedorId, ...input } });
}
