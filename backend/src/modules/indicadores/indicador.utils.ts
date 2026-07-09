import type { DireccionIndicador } from "@prisma/client";

// No se persiste en base de datos (se calcula al vuelo), por eso no viene de @prisma/client.
export type SemaforoIndicador = "VERDE" | "AMARILLO" | "ROJO";

/**
 * Semáforo de cumplimiento a partir del valor capturado contra la meta.
 * - MAYOR_ES_MEJOR (ej. % de cumplimiento): >= meta => VERDE, >= 90% de la meta => AMARILLO, resto ROJO.
 * - MENOR_ES_MEJOR (ej. tasa de defectos): <= meta => VERDE, <= 110% de la meta => AMARILLO, resto ROJO.
 */
export function calcularSemaforo(
  valor: number,
  meta: number,
  direccion: DireccionIndicador
): SemaforoIndicador {
  if (meta === 0) {
    return valor === 0 ? "VERDE" : "ROJO";
  }

  if (direccion === "MAYOR_ES_MEJOR") {
    const cumplimiento = valor / meta;
    if (cumplimiento >= 1) return "VERDE";
    if (cumplimiento >= 0.9) return "AMARILLO";
    return "ROJO";
  }

  // MENOR_ES_MEJOR
  const desviacion = valor / meta;
  if (desviacion <= 1) return "VERDE";
  if (desviacion <= 1.1) return "AMARILLO";
  return "ROJO";
}
