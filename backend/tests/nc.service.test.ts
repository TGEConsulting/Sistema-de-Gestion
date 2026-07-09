import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  noConformidad: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  accionNC: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { agregarAccion, cerrarNC } = await import("@/modules/noconformidades/nc.service");

function ncBase(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "nc-1",
    codigo: "NC-001",
    estado: "ABIERTA",
    deletedAt: null,
    acciones: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("agregarAccion", () => {
  it("mueve la NC de ABIERTA a ACCION_DEFINIDA al agregar la primera acción", async () => {
    prismaMock.noConformidad.findFirst.mockResolvedValue(ncBase());
    prismaMock.accionNC.create.mockResolvedValue({ id: "accion-1" });

    await agregarAccion("nc-1", {
      descripcion: "Reentrenar al operador",
      tipo: "CORRECTIVA",
      responsableId: "user-1",
      fechaCompromiso: new Date("2026-08-01"),
    });

    expect(prismaMock.noConformidad.update).toHaveBeenCalledWith({
      where: { id: "nc-1" },
      data: { estado: "ACCION_DEFINIDA" },
    });
  });

  it("no cambia el estado si la NC ya no está ABIERTA ni EN_ANALISIS", async () => {
    prismaMock.noConformidad.findFirst.mockResolvedValue(ncBase({ estado: "EN_IMPLEMENTACION" }));
    prismaMock.accionNC.create.mockResolvedValue({ id: "accion-2" });

    await agregarAccion("nc-1", {
      descripcion: "Acción adicional",
      tipo: "PREVENTIVA",
      responsableId: "user-1",
      fechaCompromiso: new Date("2026-08-01"),
    });

    expect(prismaMock.noConformidad.update).not.toHaveBeenCalled();
  });
});

describe("cerrarNC", () => {
  it("rechaza el cierre si no hay acciones definidas", async () => {
    prismaMock.noConformidad.findFirst.mockResolvedValue(ncBase({ acciones: [] }));

    await expect(cerrarNC("nc-1", "Evidencia de cierre")).rejects.toThrow(
      "No se puede cerrar una NC sin acciones definidas"
    );
    expect(prismaMock.noConformidad.update).not.toHaveBeenCalled();
  });

  it("rechaza el cierre si alguna acción no está COMPLETADA", async () => {
    prismaMock.noConformidad.findFirst.mockResolvedValue(
      ncBase({ acciones: [{ id: "a1", estado: "EN_PROCESO" }, { id: "a2", estado: "COMPLETADA" }] })
    );

    await expect(cerrarNC("nc-1", "Evidencia de cierre")).rejects.toThrow(
      "Todas las acciones deben estar completadas"
    );
    expect(prismaMock.noConformidad.update).not.toHaveBeenCalled();
  });

  it("cierra la NC cuando todas las acciones están COMPLETADA", async () => {
    prismaMock.noConformidad.findFirst.mockResolvedValue(
      ncBase({ acciones: [{ id: "a1", estado: "COMPLETADA" }] })
    );
    prismaMock.noConformidad.update.mockResolvedValue({ id: "nc-1", estado: "CERRADA" });

    await cerrarNC("nc-1", "Evidencia de cierre");

    expect(prismaMock.noConformidad.update).toHaveBeenCalledWith({
      where: { id: "nc-1" },
      data: { estado: "CERRADA", evidenciaCierre: "Evidencia de cierre" },
    });
  });
});
