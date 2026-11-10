import { describe, expect, it } from "vitest";
import { clausulasDe, cubreClausula } from "@/modules/documentos/documentos.utils";
import { esRequisitoPorEvaluar } from "@/modules/alertas/alertas.utils";

describe("clausulasDe", () => {
  it("separa por ; y , y limpia espacios", () => {
    expect(clausulasDe("8.2; 8.2.4, 7.5")).toEqual(["8.2", "8.2.4", "7.5"]);
  });
  it("devuelve vacío si no hay cláusulas", () => {
    expect(clausulasDe(null)).toEqual([]);
  });
});

describe("cubreClausula", () => {
  it("coincide exacta y por sub-cláusula", () => {
    expect(cubreClausula("8.2", "8.2")).toBe(true);
    expect(cubreClausula("8.2.4", "8.2")).toBe(true);
  });
  it("no confunde 8.20 con 8.2 ni cláusulas hermanas", () => {
    expect(cubreClausula("8.20", "8.2")).toBe(false);
    expect(cubreClausula("8.3", "8.2")).toBe(false);
  });
});

describe("esRequisitoPorEvaluar", () => {
  const HOY = new Date("2026-11-10T00:00:00Z");
  it("alerta cuando la próxima evaluación está a 30 días o menos", () => {
    expect(esRequisitoPorEvaluar("CUMPLE", new Date("2026-12-05T00:00:00Z"), null, HOY)).toBe(true);
    expect(esRequisitoPorEvaluar("CUMPLE", new Date("2027-03-01T00:00:00Z"), null, HOY)).toBe(false);
  });
  it("alerta un requisito nuevo por evaluar cuya entrada en vigor es inminente (Acuerdo de aditivos 17/11/2026)", () => {
    expect(esRequisitoPorEvaluar("POR_EVALUAR", null, new Date("2026-11-17T00:00:00Z"), HOY)).toBe(true);
  });
  it("no alerta requisitos que no aplican ni vigencias antiguas ya evaluadas", () => {
    expect(esRequisitoPorEvaluar("NO_APLICA", new Date("2026-11-12T00:00:00Z"), null, HOY)).toBe(false);
    expect(esRequisitoPorEvaluar("CUMPLE", null, new Date("2012-05-03T00:00:00Z"), HOY)).toBe(false);
  });
});
