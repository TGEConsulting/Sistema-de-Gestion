import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { calcularSemaforo } from "./indicador.utils";
import { buildPaginatedResult, paginationArgs } from "../../utils/pagination";
import type {
  ActualizarIndicadorInput,
  CrearIndicadorInput,
  CrearRegistroInput,
  ListarIndicadoresQuery,
} from "./indicadores.validators";

function conSemaforo<T extends { meta: number; direccion: "MAYOR_ES_MEJOR" | "MENOR_ES_MEJOR"; registros: { valor: number; fecha: Date }[] }>(
  indicador: T
) {
  const ultimo = indicador.registros[0];
  return {
    ...indicador,
    ultimoValor: ultimo?.valor ?? null,
    ultimaFecha: ultimo?.fecha ?? null,
    semaforo: ultimo ? calcularSemaforo(ultimo.valor, indicador.meta, indicador.direccion) : null,
  };
}

function construirWhereIndicadores(filtros: Omit<ListarIndicadoresQuery, "page" | "pageSize">) {
  return {
    deletedAt: null,
    ...(filtros.procesoId ? { procesoId: filtros.procesoId } : {}),
    ...(filtros.responsableId ? { responsableId: filtros.responsableId } : {}),
    ...(filtros.activo !== undefined ? { activo: filtros.activo } : {}),
  };
}

/** Exporta el historial completo de capturas (una fila por registro), no solo
 * el último valor, para que el archivo sirva de evidencia de seguimiento. */
export async function listarRegistrosParaExportar(
  filtros: Omit<ListarIndicadoresQuery, "page" | "pageSize">
) {
  const indicadores = await prisma.indicador.findMany({
    where: construirWhereIndicadores(filtros),
    include: {
      responsable: { select: { id: true, nombre: true } },
      registros: { orderBy: { fecha: "asc" }, take: 2000 },
    },
    orderBy: { nombre: "asc" },
  });

  return indicadores.flatMap((indicador) =>
    indicador.registros.map((registro) => ({
      indicador: indicador.nombre,
      responsable: indicador.responsable.nombre,
      meta: indicador.meta,
      unidad: indicador.unidad,
      fecha: registro.fecha,
      valor: registro.valor,
      semaforo: calcularSemaforo(registro.valor, indicador.meta, indicador.direccion),
      observaciones: registro.observaciones,
    }))
  );
}

export async function listarIndicadores(filtros: ListarIndicadoresQuery) {
  const where = construirWhereIndicadores(filtros);

  const [indicadores, total] = await Promise.all([
    prisma.indicador.findMany({
      where,
      include: {
        proceso: true,
        responsable: { select: { id: true, nombre: true } },
        registros: { orderBy: { fecha: "desc" }, take: 1 },
      },
      orderBy: { nombre: "asc" },
      ...paginationArgs(filtros),
    }),
    prisma.indicador.count({ where }),
  ]);

  return buildPaginatedResult(indicadores.map(conSemaforo), total, filtros);
}

export async function obtenerIndicador(id: string) {
  const indicador = await prisma.indicador.findFirst({
    where: { id, deletedAt: null },
    include: {
      proceso: true,
      responsable: { select: { id: true, nombre: true } },
      registros: { orderBy: { fecha: "asc" } },
    },
  });
  if (!indicador) throw AppError.notFound("Indicador no encontrado");
  return {
    ...indicador,
    semaforo: indicador.registros.length
      ? calcularSemaforo(
          indicador.registros[indicador.registros.length - 1].valor,
          indicador.meta,
          indicador.direccion
        )
      : null,
  };
}

export async function crearIndicador(input: CrearIndicadorInput) {
  return prisma.indicador.create({ data: input });
}

export async function actualizarIndicador(id: string, input: ActualizarIndicadorInput) {
  await obtenerIndicador(id);
  return prisma.indicador.update({ where: { id }, data: input });
}

export async function eliminarIndicador(id: string) {
  await obtenerIndicador(id);
  await prisma.indicador.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function registrarValor(
  indicadorId: string,
  input: CrearRegistroInput,
  capturadoPorId: string
) {
  await obtenerIndicador(indicadorId);

  const existente = await prisma.registroIndicador.findUnique({
    where: { indicadorId_fecha: { indicadorId, fecha: input.fecha } },
  });
  if (existente) {
    throw AppError.conflict("Ya existe un registro de este indicador para esa fecha");
  }

  return prisma.registroIndicador.create({
    data: { indicadorId, capturadoPorId, ...input },
  });
}
