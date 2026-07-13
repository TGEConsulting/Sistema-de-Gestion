import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginatedResult, paginationArgs } from "../../utils/pagination";
import type {
  ActualizarCambioInput,
  CrearCambioInput,
  ImplementarCambioInput,
  ListarCambiosQuery,
} from "./cambios.validators";

const DETALLE_INCLUDE = {
  proceso: true,
  solicitante: { select: { id: true, nombre: true } },
  comunicadoPor: { select: { id: true, nombre: true } },
};

function construirWhereCambios(filtros: Omit<ListarCambiosQuery, "page" | "pageSize">) {
  return {
    deletedAt: null,
    ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.procesoId ? { procesoId: filtros.procesoId } : {}),
    ...(filtros.q
      ? {
          OR: [
            { titulo: { contains: filtros.q, mode: "insensitive" as const } },
            { codigo: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function listarCambiosParaExportar(filtros: Omit<ListarCambiosQuery, "page" | "pageSize">) {
  return prisma.gestionCambio.findMany({
    where: construirWhereCambios(filtros),
    include: DETALLE_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
}

export async function listarCambios(filtros: ListarCambiosQuery) {
  const where = construirWhereCambios(filtros);

  const [data, total] = await Promise.all([
    prisma.gestionCambio.findMany({
      where,
      include: DETALLE_INCLUDE,
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filtros),
    }),
    prisma.gestionCambio.count({ where }),
  ]);

  return buildPaginatedResult(data, total, filtros);
}

export async function obtenerCambio(id: string) {
  const cambio = await prisma.gestionCambio.findFirst({
    where: { id, deletedAt: null },
    include: DETALLE_INCLUDE,
  });
  if (!cambio) throw AppError.notFound("Cambio no encontrado");
  return cambio;
}

async function generarCodigo() {
  const anio = new Date().getFullYear();
  const total = await prisma.gestionCambio.count({
    where: { createdAt: { gte: new Date(`${anio}-01-01`) } },
  });
  return `CAM-${anio}-${String(total + 1).padStart(3, "0")}`;
}

export async function crearCambio(input: CrearCambioInput, solicitanteId: string) {
  const codigo = await generarCodigo();
  return prisma.gestionCambio.create({
    data: { ...input, codigo, solicitanteId },
    include: DETALLE_INCLUDE,
  });
}

export async function actualizarCambio(id: string, input: ActualizarCambioInput) {
  const cambio = await obtenerCambio(id);
  if (cambio.estado !== "BORRADOR") {
    throw AppError.badRequest("Solo se puede editar un cambio mientras está en borrador");
  }
  return prisma.gestionCambio.update({ where: { id }, data: input, include: DETALLE_INCLUDE });
}

export async function eliminarCambio(id: string) {
  await obtenerCambio(id);
  await prisma.gestionCambio.update({ where: { id }, data: { deletedAt: new Date() } });
}

const CATEGORIA_LABEL: Record<string, string> = {
  MATERIA_PRIMA_PROCESO_EQUIPO: "Materia prima, proveedor, proceso o equipo",
  ETIQUETADO_DECLARACION: "Etiquetado y declaraciones del producto",
  PPR_CONTROL_OPERACIONAL: "PPR y controles operacionales",
  REQUISITO_ESQUEMA_BOS: "Requisitos de esquema / decisión BoS",
  ALCANCE_CERTIFICACION: "Alcance de certificación",
};

// Notifica a TODOS los usuarios activos (no solo a un responsable puntual, como el resto de
// las alertas): la comunicación de cambios relevantes tiene que llegarle a todo el equipo.
export async function comunicarCambio(id: string, comunicadoPorId: string) {
  const cambio = await obtenerCambio(id);
  if (cambio.estado !== "BORRADOR") {
    throw AppError.badRequest("Este cambio ya fue comunicado, implementado o cancelado");
  }

  const actualizado = await prisma.$transaction(async (tx) => {
    const cambioComunicado = await tx.gestionCambio.update({
      where: { id },
      data: { estado: "COMUNICADO", comunicadoPorId, fechaComunicacion: new Date() },
      include: DETALLE_INCLUDE,
    });

    const usuarios = await tx.usuario.findMany({ where: { activo: true, deletedAt: null } });
    await tx.notificacion.createMany({
      data: usuarios.map((u) => ({
        usuarioId: u.id,
        tipo: "CAMBIO_COMUNICADO" as const,
        titulo: `Cambio comunicado: ${cambioComunicado.titulo}`,
        mensaje: `[${CATEGORIA_LABEL[cambioComunicado.categoria]}] ${cambioComunicado.descripcion}`,
        entidadTipo: "GestionCambio",
        entidadId: cambioComunicado.id,
      })),
    });

    return cambioComunicado;
  });

  return actualizado;
}

export async function implementarCambio(id: string, input: ImplementarCambioInput) {
  const cambio = await obtenerCambio(id);
  if (cambio.estado !== "COMUNICADO") {
    throw AppError.badRequest("Un cambio debe estar comunicado antes de marcarse como implementado");
  }
  return prisma.gestionCambio.update({
    where: { id },
    data: {
      estado: "IMPLEMENTADO",
      fechaImplementacion: new Date(),
      evidenciaImplementacion: input.evidenciaImplementacion,
    },
    include: DETALLE_INCLUDE,
  });
}

export async function cancelarCambio(id: string) {
  const cambio = await obtenerCambio(id);
  if (cambio.estado !== "BORRADOR") {
    throw AppError.badRequest("Solo se puede cancelar un cambio mientras está en borrador");
  }
  return prisma.gestionCambio.update({
    where: { id },
    data: { estado: "CANCELADO" },
    include: DETALLE_INCLUDE,
  });
}
