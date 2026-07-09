import { describe, expect, it } from "vitest";
import {
  esAccionVencida,
  esAuditoriaProxima,
  esDocumentoPorVencer,
  esIndicadorSinCaptura,
  esNCSinAtender,
} from "@/modules/alertas/alertas.utils";

const HOY = new Date("2026-07-06T00:00:00Z");

describe("esDocumentoPorVencer", () => {
  it("es true si faltan 30 días o menos para la revisión", () => {
    expect(esDocumentoPorVencer(new Date("2026-08-05T00:00:00Z"), HOY)).toBe(true);
  });

  it("es false si faltan más de 30 días", () => {
    expect(esDocumentoPorVencer(new Date("2026-09-01T00:00:00Z"), HOY)).toBe(false);
  });

  it("es false si no tiene fecha de revisión", () => {
    expect(esDocumentoPorVencer(null, HOY)).toBe(false);
  });
});

describe("esNCSinAtender", () => {
  it("es true si sigue ABIERTA por 5 días o más", () => {
    expect(esNCSinAtender("ABIERTA", new Date("2026-07-01T00:00:00Z"), HOY)).toBe(true);
  });

  it("es false si ya no está ABIERTA", () => {
    expect(esNCSinAtender("CERRADA", new Date("2026-07-01T00:00:00Z"), HOY)).toBe(false);
  });

  it("es false si fue detectada hace menos de 5 días", () => {
    expect(esNCSinAtender("ABIERTA", new Date("2026-07-05T00:00:00Z"), HOY)).toBe(false);
  });
});

describe("esIndicadorSinCaptura", () => {
  it("es true si nunca se ha capturado", () => {
    expect(esIndicadorSinCaptura(null, HOY, "MENSUAL")).toBe(true);
  });

  it("es true si supera la ventana de la frecuencia", () => {
    expect(esIndicadorSinCaptura(new Date("2026-06-01T00:00:00Z"), HOY, "SEMANAL")).toBe(true);
  });

  it("es false si está dentro de la ventana esperada", () => {
    expect(esIndicadorSinCaptura(new Date("2026-07-01T00:00:00Z"), HOY, "MENSUAL")).toBe(false);
  });
});

describe("esAuditoriaProxima", () => {
  it("es true si inicia dentro de 15 días y está programada", () => {
    expect(esAuditoriaProxima(new Date("2026-07-15T00:00:00Z"), "PROGRAMADA", HOY)).toBe(true);
  });

  it("es false si ya inició o está en otro estado", () => {
    expect(esAuditoriaProxima(new Date("2026-07-15T00:00:00Z"), "FINALIZADA", HOY)).toBe(false);
    expect(esAuditoriaProxima(new Date("2026-07-25T00:00:00Z"), "PROGRAMADA", HOY)).toBe(false);
  });
});

describe("esAccionVencida", () => {
  it("es true si la fecha compromiso ya pasó y no está cerrada", () => {
    expect(esAccionVencida(new Date("2026-07-01T00:00:00Z"), "EN_PROCESO", HOY)).toBe(true);
  });

  it("es false si ya está completada", () => {
    expect(esAccionVencida(new Date("2026-07-01T00:00:00Z"), "COMPLETADA", HOY)).toBe(false);
  });

  it("es false si la fecha compromiso aún no llega", () => {
    expect(esAccionVencida(new Date("2026-08-01T00:00:00Z"), "PENDIENTE", HOY)).toBe(false);
  });
});
