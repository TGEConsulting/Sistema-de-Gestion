const MS_POR_DIA = 24 * 60 * 60 * 1000;

function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((hasta.getTime() - desde.getTime()) / MS_POR_DIA);
}

/** Un documento genera alerta si su próxima revisión ocurre dentro de `diasAnticipacion`. */
export function esDocumentoPorVencer(
  proximaRevision: Date | null,
  hoy: Date,
  diasAnticipacion = 30
): boolean {
  if (!proximaRevision) return false;
  const dias = diasEntre(hoy, proximaRevision);
  return dias <= diasAnticipacion;
}

/** Una NC abierta sin acciones definidas por más de `diasLimite` días se considera sin atender. */
export function esNCSinAtender(
  estado: string,
  fechaDeteccion: Date,
  hoy: Date,
  diasLimite = 5
): boolean {
  if (estado !== "ABIERTA") return false;
  return diasEntre(fechaDeteccion, hoy) >= diasLimite;
}

/** Un indicador no ha sido capturado si no hay registro dentro del periodo esperado. */
export function esIndicadorSinCaptura(
  ultimaCaptura: Date | null,
  hoy: Date,
  frecuencia: "DIARIA" | "SEMANAL" | "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"
): boolean {
  const diasPorFrecuencia: Record<typeof frecuencia, number> = {
    DIARIA: 1,
    SEMANAL: 7,
    MENSUAL: 31,
    TRIMESTRAL: 93,
    SEMESTRAL: 186,
    ANUAL: 366,
  };

  if (!ultimaCaptura) return true;
  return diasEntre(ultimaCaptura, hoy) > diasPorFrecuencia[frecuencia];
}

/** Una auditoría programada dentro de `diasAnticipacion` genera recordatorio. */
export function esAuditoriaProxima(
  fechaInicio: Date,
  estado: string,
  hoy: Date,
  diasAnticipacion = 15
): boolean {
  if (estado !== "PROGRAMADA") return false;
  const dias = diasEntre(hoy, fechaInicio);
  return dias >= 0 && dias <= diasAnticipacion;
}

/** Una acción/actividad se considera vencida si su fecha compromiso ya pasó y sigue abierta. */
export function esAccionVencida(fechaCompromiso: Date, estado: string, hoy: Date): boolean {
  const estadosCerrados = ["COMPLETADA", "CERRADA", "VERIFICADO", "IMPLEMENTADO"];
  if (estadosCerrados.includes(estado)) return false;
  return fechaCompromiso.getTime() < hoy.getTime();
}
