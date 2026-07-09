import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { buildPaginatedResult, paginationArgs } from "@/utils/pagination";
import type {
  ActualizarDocumentoInput,
  CrearDocumentoInput,
  CrearVersionInput,
  ListarDocumentosQuery,
} from "@/modules/documentos/documentos.validators";

const DETALLE_INCLUDE = {
  tipoDocumento: true,
  area: true,
  responsable: { select: { id: true, nombre: true, email: true } },
  versionVigente: true,
  versiones: {
    orderBy: { numeroVersion: "asc" as const },
    include: {
      creadoPor: { select: { id: true, nombre: true } },
      aprobadoPor: { select: { id: true, nombre: true } },
    },
  },
};

function construirWhereDocumentos(filtros: Omit<ListarDocumentosQuery, "page" | "pageSize">) {
  return {
    deletedAt: null,
    ...(filtros.tipoDocumentoId ? { tipoDocumentoId: filtros.tipoDocumentoId } : {}),
    ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.responsableId ? { responsableId: filtros.responsableId } : {}),
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

export async function listarDocumentosParaExportar(
  filtros: Omit<ListarDocumentosQuery, "page" | "pageSize">
) {
  return prisma.documento.findMany({
    where: construirWhereDocumentos(filtros),
    include: {
      tipoDocumento: true,
      area: true,
      responsable: { select: { id: true, nombre: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });
}

export async function listarDocumentos(filtros: ListarDocumentosQuery) {
  const where = construirWhereDocumentos(filtros);

  const [data, total] = await Promise.all([
    prisma.documento.findMany({
      where,
      include: {
        tipoDocumento: true,
        area: true,
        responsable: { select: { id: true, nombre: true } },
      },
      orderBy: { updatedAt: "desc" },
      ...paginationArgs(filtros),
    }),
    prisma.documento.count({ where }),
  ]);

  return buildPaginatedResult(data, total, filtros);
}

export async function obtenerDocumento(id: string) {
  const documento = await prisma.documento.findFirst({
    where: { id, deletedAt: null },
    include: DETALLE_INCLUDE,
  });
  if (!documento) throw AppError.notFound("Documento no encontrado");
  return documento;
}

export async function crearDocumento(input: CrearDocumentoInput, usuarioId: string) {
  const codigoExistente = await prisma.documento.findUnique({ where: { codigo: input.codigo } });
  if (codigoExistente) throw AppError.conflict("Ya existe un documento con ese código");

  return prisma.$transaction(async (tx) => {
    const documento = await tx.documento.create({
      data: {
        codigo: input.codigo,
        titulo: input.titulo,
        tipoDocumentoId: input.tipoDocumentoId,
        areaId: input.areaId,
        responsableId: input.responsableId,
        proximaRevision: input.proximaRevision,
        estado: "BORRADOR",
      },
    });

    await tx.versionDocumento.create({
      data: {
        documentoId: documento.id,
        numeroVersion: 1,
        estado: "BORRADOR",
        creadoPorId: usuarioId,
      },
    });

    return documento;
  });
}

export async function actualizarDocumento(id: string, input: ActualizarDocumentoInput) {
  await obtenerDocumento(id);
  return prisma.documento.update({ where: { id }, data: input });
}

export async function eliminarDocumento(id: string) {
  await obtenerDocumento(id);
  await prisma.documento.update({ where: { id }, data: { deletedAt: new Date() } });
}

async function obtenerVersionVigenteEnRevision(documentoId: string) {
  const documento = await obtenerDocumento(documentoId);
  const versionActual = documento.versiones[documento.versiones.length - 1];
  if (!versionActual) throw AppError.badRequest("El documento no tiene versiones");
  return { documento, versionActual };
}

export async function enviarARevision(documentoId: string) {
  const { versionActual } = await obtenerVersionVigenteEnRevision(documentoId);
  if (versionActual.estado !== "BORRADOR") {
    throw AppError.badRequest("Solo se puede enviar a revisión una versión en BORRADOR");
  }

  await prisma.$transaction([
    prisma.versionDocumento.update({
      where: { id: versionActual.id },
      data: { estado: "EN_REVISION" },
    }),
    prisma.documento.update({ where: { id: documentoId }, data: { estado: "EN_REVISION" } }),
  ]);
}

export async function aprobarDocumento(documentoId: string, aprobadoPorId: string) {
  const { versionActual } = await obtenerVersionVigenteEnRevision(documentoId);
  if (versionActual.estado !== "EN_REVISION") {
    throw AppError.badRequest("Solo se puede aprobar una versión en revisión");
  }

  await prisma.$transaction([
    prisma.versionDocumento.update({
      where: { id: versionActual.id },
      data: { estado: "APROBADO", aprobadoPorId, fechaAprobacion: new Date() },
    }),
    prisma.documento.update({
      where: { id: documentoId },
      data: { estado: "APROBADO", versionVigenteId: versionActual.id },
    }),
  ]);
}

export async function marcarObsoleto(documentoId: string) {
  await obtenerDocumento(documentoId);
  await prisma.documento.update({ where: { id: documentoId }, data: { estado: "OBSOLETO" } });
}

export async function crearNuevaVersion(
  documentoId: string,
  input: CrearVersionInput,
  usuarioId: string
) {
  const documento = await obtenerDocumento(documentoId);
  if (documento.estado !== "APROBADO") {
    throw AppError.badRequest("Solo se puede crear una nueva versión de un documento APROBADO");
  }

  const siguienteNumero = documento.versiones.length + 1;

  return prisma.$transaction(async (tx) => {
    const nuevaVersion = await tx.versionDocumento.create({
      data: {
        documentoId,
        numeroVersion: siguienteNumero,
        estado: "BORRADOR",
        creadoPorId: usuarioId,
        cambios: input.cambios,
        archivoUrl: input.archivoUrl,
      },
    });

    await tx.documento.update({ where: { id: documentoId }, data: { estado: "BORRADOR" } });

    return nuevaVersion;
  });
}

export async function registrarEvidenciaLectura(
  documentoId: string,
  usuarioId: string,
  medio: string | undefined
) {
  const documento = await obtenerDocumento(documentoId);
  const versionId = documento.versionVigenteId ?? documento.versiones.at(-1)?.id;
  if (!versionId) throw AppError.badRequest("El documento no tiene una versión para registrar lectura");

  return prisma.evidenciaLectura.create({
    data: { documentoId, versionDocumentoId: versionId, usuarioId, medio },
  });
}
