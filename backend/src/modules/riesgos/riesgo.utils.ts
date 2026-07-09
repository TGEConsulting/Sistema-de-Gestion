import type { NivelRiesgo } from "@prisma/client";

export interface ResultadoNivelRiesgo {
  puntaje: number;
  nivel: NivelRiesgo;
}

/**
 * Matriz de riesgo 5x5 estándar: puntaje = probabilidad * impacto (cada uno 1-5).
 * Rangos: 1-4 BAJO, 5-9 MODERADO, 10-16 ALTO, 17-25 CRITICO.
 */
export function calcularNivelRiesgo(probabilidad: number, impacto: number): ResultadoNivelRiesgo {
  if (!Number.isInteger(probabilidad) || probabilidad < 1 || probabilidad > 5) {
    throw new Error("La probabilidad debe ser un entero entre 1 y 5");
  }
  if (!Number.isInteger(impacto) || impacto < 1 || impacto > 5) {
    throw new Error("El impacto debe ser un entero entre 1 y 5");
  }

  const puntaje = probabilidad * impacto;

  let nivel: NivelRiesgo;
  if (puntaje <= 4) nivel = "BAJO";
  else if (puntaje <= 9) nivel = "MODERADO";
  else if (puntaje <= 16) nivel = "ALTO";
  else nivel = "CRITICO";

  return { puntaje, nivel };
}
