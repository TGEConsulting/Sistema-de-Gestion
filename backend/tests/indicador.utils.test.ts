import { describe, expect, it } from "vitest";
import { calcularSemaforo } from "@/modules/indicadores/indicador.utils";

describe("calcularSemaforo", () => {
  it("MAYOR_ES_MEJOR: verde si cumple o supera la meta", () => {
    expect(calcularSemaforo(100, 100, "MAYOR_ES_MEJOR")).toBe("VERDE");
    expect(calcularSemaforo(110, 100, "MAYOR_ES_MEJOR")).toBe("VERDE");
  });

  it("MAYOR_ES_MEJOR: amarillo entre 90% y 100% de la meta", () => {
    expect(calcularSemaforo(95, 100, "MAYOR_ES_MEJOR")).toBe("AMARILLO");
    expect(calcularSemaforo(90, 100, "MAYOR_ES_MEJOR")).toBe("AMARILLO");
  });

  it("MAYOR_ES_MEJOR: rojo por debajo del 90% de la meta", () => {
    expect(calcularSemaforo(89, 100, "MAYOR_ES_MEJOR")).toBe("ROJO");
  });

  it("MENOR_ES_MEJOR: verde si el valor es igual o menor a la meta", () => {
    expect(calcularSemaforo(2, 5, "MENOR_ES_MEJOR")).toBe("VERDE");
    expect(calcularSemaforo(5, 5, "MENOR_ES_MEJOR")).toBe("VERDE");
  });

  it("MENOR_ES_MEJOR: amarillo hasta 10% por encima de la meta", () => {
    expect(calcularSemaforo(5.5, 5, "MENOR_ES_MEJOR")).toBe("AMARILLO");
  });

  it("MENOR_ES_MEJOR: rojo si supera 10% de la meta", () => {
    expect(calcularSemaforo(6, 5, "MENOR_ES_MEJOR")).toBe("ROJO");
  });

  it("maneja meta 0 sin dividir entre cero", () => {
    expect(calcularSemaforo(0, 0, "MAYOR_ES_MEJOR")).toBe("VERDE");
    expect(calcularSemaforo(1, 0, "MAYOR_ES_MEJOR")).toBe("ROJO");
  });
});
