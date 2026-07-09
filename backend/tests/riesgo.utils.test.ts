import { describe, expect, it } from "vitest";
import { calcularNivelRiesgo } from "@/modules/riesgos/riesgo.utils";

describe("calcularNivelRiesgo", () => {
  it("clasifica como BAJO cuando el puntaje es <= 4", () => {
    expect(calcularNivelRiesgo(1, 1)).toEqual({ puntaje: 1, nivel: "BAJO" });
    expect(calcularNivelRiesgo(2, 2)).toEqual({ puntaje: 4, nivel: "BAJO" });
  });

  it("clasifica como MODERADO entre 5 y 9", () => {
    expect(calcularNivelRiesgo(1, 5)).toEqual({ puntaje: 5, nivel: "MODERADO" });
    expect(calcularNivelRiesgo(3, 3)).toEqual({ puntaje: 9, nivel: "MODERADO" });
  });

  it("clasifica como ALTO entre 10 y 16", () => {
    expect(calcularNivelRiesgo(2, 5)).toEqual({ puntaje: 10, nivel: "ALTO" });
    expect(calcularNivelRiesgo(4, 4)).toEqual({ puntaje: 16, nivel: "ALTO" });
  });

  it("clasifica como CRITICO por encima de 16", () => {
    expect(calcularNivelRiesgo(4, 5)).toEqual({ puntaje: 20, nivel: "CRITICO" });
    expect(calcularNivelRiesgo(5, 5)).toEqual({ puntaje: 25, nivel: "CRITICO" });
  });

  it("rechaza valores fuera de rango 1-5", () => {
    expect(() => calcularNivelRiesgo(0, 3)).toThrow();
    expect(() => calcularNivelRiesgo(3, 6)).toThrow();
    expect(() => calcularNivelRiesgo(2.5, 3)).toThrow();
  });
});
