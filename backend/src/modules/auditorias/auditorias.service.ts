import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { buildPaginatedResult, paginationArgs } from "@/utils/pagination";
import type {
  ActualizarAuditoriaInput,
  CrearAuditoriaInput,
  CrearChecklistInput,
  CrearHallazgoInput,
  CrearInformeInput,
  ListarAuditoriasQuery,
} from "@/modules/auditorias/auditorias.validators";

const DETALLE_INCLUDE = {
  programa: true,
  liderAuditor: { select: { id: true, nombre: true } },
  checklists: { include: { preguntas: true } },
  hallazgos: {
    include: {
      proceso: true,
      responsable: { select: { id: true, nombre: true } },
      noConformidad: true,
    },
  },
  informe: true,
};

function construirWhereAuditorias(filtros: Omit<ListarAuditoriasQuery, "page" | "pageSize">) {
  return {
    deletedAt: null,
    ...(filtros.estado ? { estado: filtros.estado as never } : {}),
    ...(filtros.programaId ? { programaId: filtros.programaId } : {}),
  };
}

export async function listarAuditoriasParaExportar(
  filtros: Omit<ListarAuditoriasQuery, "page" | "pageSize">
) {
  return prisma.auditoria.findMany({
    where: construirWhereAuditorias(filtros),
    include: {
      programa: true,
      liderAuditor: { select: { id: true, nombre: true } },
      hallazgos: true,
    },
    orderBy: { fechaInicio: "desc" },
    take: 5000,
  });
}

export async function listarAuditorias(filtros: ListarAuditoriasQuery) {
  const where = construirWhereAuditorias(filtros);

  const [data, total] = await Promise.all([
    prisma.auditoria.findMany({
      where,
      include: { programa: true, liderAuditor: { select: { id: true, nombre: true } } },
      orderBy: { fechaInicio: "desc" },
      ...paginationArgs(filtros),
    }),
    prisma.auditoria.count({ where }),
  ]);

  return buildPaginatedResult(data, total, filtros);
}

export async function obtenerAuditoria(id: string) {
  const auditoria = await prisma.auditoria.findFirst({
    where: { id, deletedAt: null },
    include: DETALLE_INCLUDE,
  });
  if (!auditoria) throw AppError.notFound("Auditoría no encontrada");
  return auditoria;
}

export async function crearAuditoria(input: CrearAuditoriaInput) {
  return prisma.auditoria.create({ data: { ...input, estado: "PROGRAMADA" } });
}

export async function actualizarAuditoria(id: string, input: ActualizarAuditoriaInput) {
  await obtenerAuditoria(id);
  return prisma.auditoria.update({ where: { id }, data: input });
}

export async function eliminarAuditoria(id: string) {
  await obtenerAuditoria(id);
  await prisma.auditoria.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function iniciarAuditoria(id: string) {
  await obtenerAuditoria(id);
  return prisma.auditoria.update({ where: { id }, data: { estado: "EN_EJECUCION" } });
}

export async function cancelarAuditoria(id: string) {
  await obtenerAuditoria(id);
  return prisma.auditoria.update({ where: { id }, data: { estado: "CANCELADA" } });
}

export async function agregarChecklist(auditoriaId: string, input: CrearChecklistInput) {
  await obtenerAuditoria(auditoriaId);
  return prisma.checklist.create({
    data: {
      auditoriaId,
      nombre: input.nombre,
      preguntas: input.preguntas
        ? { create: input.preguntas.map((texto) => ({ texto })) }
        : undefined,
    },
    include: { preguntas: true },
  });
}

export async function responderPregunta(
  preguntaId: string,
  input: { respuesta: "CUMPLE" | "NO_CUMPLE" | "NO_APLICA" | "PENDIENTE"; observaciones?: string; evidenciaUrl?: string }
) {
  const pregunta = await prisma.preguntaChecklist.findUnique({ where: { id: preguntaId } });
  if (!pregunta) throw AppError.notFound("Pregunta no encontrada");
  return prisma.preguntaChecklist.update({ where: { id: preguntaId }, data: input });
}

export async function agregarHallazgo(auditoriaId: string, input: CrearHallazgoInput) {
  const auditoria = await obtenerAuditoria(auditoriaId);

  return prisma.$transaction(async (tx) => {
    let noConformidadId: string | undefined;

    if (input.tipo === "NO_CONFORMIDAD") {
      const nc = await tx.noConformidad.create({
        data: {
          codigo: `NC-AUD-${Date.now().toString(36).toUpperCase()}`,
          origen: "AUDITORIA",
          descripcion: input.descripcion,
          procesoId: input.procesoId,
          responsableId: input.responsableId ?? auditoria.liderAuditorId,
          estado: "ABIERTA",
        },
      });
      noConformidadId = nc.id;
    }

    return tx.hallazgo.create({
      data: {
        auditoriaId,
        tipo: input.tipo,
        descripcion: input.descripcion,
        procesoId: input.procesoId,
        responsableId: input.responsableId,
        noConformidadId,
      },
      include: { noConformidad: true },
    });
  });
}

export async function crearInforme(auditoriaId: string, input: CrearInformeInput) {
  await obtenerAuditoria(auditoriaId);

  return prisma.$transaction(async (tx) => {
    const informe = await tx.informeAuditoria.upsert({
      where: { auditoriaId },
      update: input,
      create: { auditoriaId, ...input },
    });
    await tx.auditoria.update({ where: { id: auditoriaId }, data: { estado: "FINALIZADA" } });
    return informe;
  });
}
