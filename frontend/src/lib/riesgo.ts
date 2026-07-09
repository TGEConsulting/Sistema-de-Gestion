import type { NivelRiesgo } from "@/types";

// Espejo de backend/src/modules/riesgos/riesgo.utils.ts, solo para dar una vista previa
// instantánea en el formulario antes de guardar. El backend es la fuente de verdad.
export function calcularNivelRiesgo(probabilidad: number, impacto: number): { puntaje: number; nivel: NivelRiesgo } {
  const puntaje = probabilidad * impacto;
  let nivel: NivelRiesgo;
  if (puntaje <= 4) nivel = "BAJO";
  else if (puntaje <= 9) nivel = "MODERADO";
  else if (puntaje <= 16) nivel = "ALTO";
  else nivel = "CRITICO";
  return { puntaje, nivel };
}
