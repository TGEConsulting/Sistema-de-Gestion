import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  riesgo: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { actualizarRiesgo, crearRiesgo } = await import("@/modules/riesgos/riesgos.service");

function riesgoBase(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "riesgo-1",
    codigo: "RSG-001",
    probabilidad: 2,
    impacto: 2,
    puntajeRiesgo: 4,
    nivelRiesgo: "BAJO",
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("actualizarRiesgo", () => {
  it("recalcula nivel y puntaje cuando cambia el impacto", async () => {
    prismaMock.riesgo.findFirst.mockResolvedValue(riesgoBase());
    prismaMock.riesgo.update.mockResolvedValue({});

    await actualizarRiesgo("riesgo-1", { impacto: 5 });

    expect(prismaMock.riesgo.update).toHaveBeenCalledWith({
      where: { id: "riesgo-1" },
      data: expect.objectContaining({
        probabilidad: 2,
        impacto: 5,
        puntajeRiesgo: 10,
        nivelRiesgo: "ALTO",
      }),
    });
  });

  it("conserva probabilidad/impacto existentes cuando no se envían", async () => {
    prismaMock.riesgo.findFirst.mockResolvedValue(riesgoBase({ probabilidad: 4, impacto: 4, puntajeRiesgo: 16, nivelRiesgo: "ALTO" }));
    prismaMock.riesgo.update.mockResolvedValue({});

    await actualizarRiesgo("riesgo-1", { controlesExistentes: "Doble verificación" });

    expect(prismaMock.riesgo.update).toHaveBeenCalledWith({
      where: { id: "riesgo-1" },
      data: expect.objectContaining({
        probabilidad: 4,
        impacto: 4,
        puntajeRiesgo: 16,
        nivelRiesgo: "ALTO",
      }),
    });
  });
});

describe("crearRiesgo", () => {
  it("rechaza un código duplicado", async () => {
    prismaMock.riesgo.findUnique.mockResolvedValue(riesgoBase());

    await expect(
      crearRiesgo({
        codigo: "RSG-001",
        descripcion: "Riesgo duplicado",
        procesoId: "p1",
        categoriaId: "c1",
        probabilidad: 3,
        impacto: 3,
        responsableId: "u1",
      })
    ).rejects.toThrow("Ya existe un riesgo con ese código");

    expect(prismaMock.riesgo.create).not.toHaveBeenCalled();
  });

  it("calcula el nivel de riesgo al crear", async () => {
    prismaMock.riesgo.findUnique.mockResolvedValue(null);
    prismaMock.riesgo.create.mockResolvedValue({});

    await crearRiesgo({
      codigo: "RSG-002",
      descripcion: "Riesgo nuevo",
      procesoId: "p1",
      categoriaId: "c1",
      probabilidad: 5,
      impacto: 5,
      responsableId: "u1",
    });

    expect(prismaMock.riesgo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ puntajeRiesgo: 25, nivelRiesgo: "CRITICO" }),
    });
  });
});
