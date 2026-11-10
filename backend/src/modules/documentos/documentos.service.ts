import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginatedResult, paginationArgs } from "../../utils/pagination";
import type {
  ActualizarDocumentoInput,
  CrearDocumentoInput,
  CrearVersionInput,
  ListarDocumentosQuery,
} from "./documentos.validators";
import { clausulasDe, cubreClausula } from "./documentos.utils";

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
    ...(filtros.documentoPadreId ? { documentoPadreId: filtros.documentoPadreId } : {}),
    ...(filtros.nivel ? { nivel: filtros.nivel } : {}),
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
        documentoPadreId: input.documentoPadreId,
        nivel: input.nivel,
        revision: input.revision ?? "00",
        clausulas: input.clausulas,
        evidencias: input.evidencias,
        participa: input.participa,
        autoriza: input.autoriza,
        carpeta: input.carpeta,
        critico: input.critico ?? false,
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

// ----------------------------------------------------------------------------
// Lista Maestra (PR-IMS-01-F01) y paquete por esquema (PR-IMS-08-A02)
// ----------------------------------------------------------------------------

const ESTADO_LM: Record<string, string> = {
  BORRADOR: "Por elaborar",
  EN_REVISION: "En revisión",
  APROBADO: "Emitido",
  OBSOLETO: "Obsoleto",
};

/** Todos los documentos vivos con los metadatos de la Lista Maestra, ordenados por código. */
export async function listaMaestra() {
  const docs = await prisma.documento.findMany({
    where: { deletedAt: null },
    include: {
      tipoDocumento: true,
      area: true,
      responsable: { select: { nombre: true } },
      documentoPadre: { select: { codigo: true } },
      versionVigente: { select: { numeroVersion: true, fechaAprobacion: true } },
    },
    orderBy: { codigo: "asc" },
  });
  return docs.map((d) => ({
    codigo: d.codigo,
    titulo: d.titulo,
    tipo: d.tipoDocumento.nombre,
    nivel: d.nivel,
    padre: d.documentoPadre?.codigo ?? null,
    area: d.area.nombre,
    responsable: d.responsable.nombre,
    participa: d.participa,
    autoriza: d.autoriza,
    clausulas: d.clausulas,
    evidencias: d.evidencias,
    critico: d.critico,
    carpeta: d.carpeta,
    revision: d.revision,
    estado: ESTADO_LM[d.estado] ?? d.estado,
    fechaEmision: d.versionVigente?.fechaAprobacion ?? null,
    proximaRevision: d.proximaRevision,
  }));
}


export async function listarEsquemas() {
  const filas = await prisma.esquemaReferencia.groupBy({ by: ["esquema"], _count: { _all: true }, orderBy: { esquema: "asc" } });
  return filas.map((f) => ({ esquema: f.esquema, referencias: f._count._all }));
}

/** Paquete de evidencias por esquema: para cada requisito del esquema, los documentos
 * (padres e hijos) cuya columna de cláusulas lo cubre, con su estado y carpeta. */
export async function paquetePorEsquema(esquema: string) {
  const [referencias, docs] = await Promise.all([
    prisma.esquemaReferencia.findMany({ where: { esquema }, orderBy: { id: "asc" } }),
    prisma.documento.findMany({
      where: { deletedAt: null },
      select: { codigo: true, titulo: true, clausulas: true, nivel: true, estado: true, carpeta: true, documentoPadreId: true, id: true },
      orderBy: { codigo: "asc" },
    }),
  ]);
  if (referencias.length === 0) throw AppError.notFound("Esquema sin referencias cargadas");

  const porId = new Map(docs.map((d) => [d.id, d]));
  return referencias.map((ref) => {
    const padres = docs.filter((d) => !d.documentoPadreId && clausulasDe(d.clausulas).some((c) => cubreClausula(c, ref.clausula)));
    const padresIds = new Set(padres.map((p) => p.id));
    const hijos = docs.filter((d) => d.documentoPadreId && padresIds.has(d.documentoPadreId));
    const todos = [...padres, ...hijos];
    const listo = todos.length > 0 && todos.every((d) => d.estado === "EN_REVISION" || d.estado === "APROBADO");
    return {
      esquema,
      referencia: ref.referencia,
      clausula: ref.clausula,
      documentos: padres.map((d) => ({ codigo: d.codigo, titulo: d.titulo, estado: d.estado, carpeta: d.carpeta })),
      registros: hijos.map((d) => ({ codigo: d.codigo, titulo: d.titulo, estado: d.estado, carpeta: porId.get(d.id)?.carpeta ?? null })),
      carpetas: [...new Set(todos.map((d) => d.carpeta).filter(Boolean))],
      estado: todos.length === 0 ? "SIN_DOCUMENTO" : listo ? "LISTO" : "PENDIENTE",
    };
  });
}
