/** Separa la columna "cláusulas" de la Lista Maestra ("8.2; 8.2.4") en cláusulas individuales. */
export function clausulasDe(texto: string | null | undefined): string[] {
  return (texto ?? "")
    .split(/[;,]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Una cláusula de un documento cubre la referencia del esquema si es la misma o una sub-cláusula. */
export function cubreClausula(clausulaDoc: string, clausulaEsquema: string): boolean {
  return clausulaDoc === clausulaEsquema || clausulaDoc.startsWith(clausulaEsquema + ".");
}
