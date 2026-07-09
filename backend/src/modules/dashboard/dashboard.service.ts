import { prisma } from "../../lib/prisma";
import { calcularSemaforo } from "../indicadores/indicador.utils";

export async function obtenerResumen(usuarioId: string) {
  const [
    tareasPendientes,
    notificacionesNoLeidas,
    documentosPorEstado,
    ncPorEstado,
    riesgosPorNivel,
    proximasAuditorias,
    indicadoresActivos,
  ] = await Promise.all([
    prisma.tarea.findMany({
      where: { asignadoAId: usuarioId, estado: { in: ["PENDIENTE", "EN_PROCESO"] } },
      orderBy: { fechaVencimiento: "asc" },
      take: 20,
    }),
    prisma.notificacion.findMany({
      where: { usuarioId, leida: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.documento.groupBy({
      by: ["estado"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.noConformidad.groupBy({
      by: ["estado"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.riesgo.groupBy({
      by: ["nivelRiesgo"],
      where: { deletedAt: null, estado: { not: "CERRADO" } },
      _count: { _all: true },
    }),
    prisma.auditoria.findMany({
      where: { deletedAt: null, estado: "PROGRAMADA" },
      orderBy: { fechaInicio: "asc" },
      take: 5,
    }),
    prisma.indicador.findMany({
      where: { deletedAt: null, activo: true },
      include: { registros: { orderBy: { fecha: "desc" }, take: 1 } },
    }),
  ]);

  const semaforoIndicadores = { VERDE: 0, AMARILLO: 0, ROJO: 0, SIN_DATOS: 0 };
  for (const indicador of indicadoresActivos) {
    const ultimoRegistro = indicador.registros[0];
    if (!ultimoRegistro) {
      semaforoIndicadores.SIN_DATOS += 1;
      continue;
    }
    const semaforo = calcularSemaforo(ultimoRegistro.valor, indicador.meta, indicador.direccion);
    semaforoIndicadores[semaforo] += 1;
  }

  return {
    tareasPendientes,
    notificacionesNoLeidas,
    documentosPorEstado: documentosPorEstado.map((d) => ({ estado: d.estado, total: d._count._all })),
    noConformidadesPorEstado: ncPorEstado.map((n) => ({ estado: n.estado, total: n._count._all })),
    riesgosPorNivel: riesgosPorNivel.map((r) => ({ nivel: r.nivelRiesgo, total: r._count._all })),
    proximasAuditorias,
    semaforoIndicadores,
  };
}
