import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  documento: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  versionDocumento: {
    update: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn((arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (typeof arg === "function") return arg(prismaMock);
    return Promise.resolve(arg);
  }),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { enviarARevision, aprobarDocumento, crearNuevaVersion } = await import(
  "@/modules/documentos/documentos.service"
);

function documentoConVersiones(versiones: Array<{ id: string; numeroVersion: number; estado: string }>, estado = "BORRADOR") {
  return {
    id: "doc-1",
    estado,
    versionVigenteId: null,
    deletedAt: null,
    versiones,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation((arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (typeof arg === "function") return (arg as (tx: unknown) => unknown)(prismaMock);
    return Promise.resolve(arg);
  });
});

describe("enviarARevision", () => {
  it("rechaza si la última versión no está en BORRADOR", async () => {
    prismaMock.documento.findFirst.mockResolvedValue(
      documentoConVersiones([{ id: "v1", numeroVersion: 1, estado: "EN_REVISION" }])
    );

    await expect(enviarARevision("doc-1")).rejects.toThrow(
      "Solo se puede enviar a revisión una versión en BORRADOR"
    );
  });

  it("marca la versión y el documento como EN_REVISION", async () => {
    prismaMock.documento.findFirst.mockResolvedValue(
      documentoConVersiones([{ id: "v1", numeroVersion: 1, estado: "BORRADOR" }])
    );
    prismaMock.versionDocumento.update.mockResolvedValue({});
    prismaMock.documento.update.mockResolvedValue({});

    await enviarARevision("doc-1");

    expect(prismaMock.versionDocumento.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { estado: "EN_REVISION" },
    });
    expect(prismaMock.documento.update).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      data: { estado: "EN_REVISION" },
    });
  });
});

describe("aprobarDocumento", () => {
  it("rechaza si la última versión no está EN_REVISION", async () => {
    prismaMock.documento.findFirst.mockResolvedValue(
      documentoConVersiones([{ id: "v1", numeroVersion: 1, estado: "BORRADOR" }])
    );

    await expect(aprobarDocumento("doc-1", "user-1")).rejects.toThrow(
      "Solo se puede aprobar una versión en revisión"
    );
  });

  it("aprueba la versión y la marca como vigente del documento", async () => {
    prismaMock.documento.findFirst.mockResolvedValue(
      documentoConVersiones([{ id: "v1", numeroVersion: 1, estado: "EN_REVISION" }])
    );
    prismaMock.versionDocumento.update.mockResolvedValue({});
    prismaMock.documento.update.mockResolvedValue({});

    await aprobarDocumento("doc-1", "user-1");

    expect(prismaMock.versionDocumento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: expect.objectContaining({ estado: "APROBADO", aprobadoPorId: "user-1" }),
      })
    );
    expect(prismaMock.documento.update).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      data: { estado: "APROBADO", versionVigenteId: "v1" },
    });
  });
});

describe("crearNuevaVersion", () => {
  it("rechaza crear una versión nueva si el documento no está APROBADO", async () => {
    prismaMock.documento.findFirst.mockResolvedValue(
      documentoConVersiones([{ id: "v1", numeroVersion: 1, estado: "BORRADOR" }], "BORRADOR")
    );

    await expect(crearNuevaVersion("doc-1", {}, "user-1")).rejects.toThrow(
      "Solo se puede crear una nueva versión de un documento APROBADO"
    );
  });

  it("crea la versión 2 y regresa el documento a BORRADOR", async () => {
    prismaMock.documento.findFirst.mockResolvedValue(
      documentoConVersiones([{ id: "v1", numeroVersion: 1, estado: "APROBADO" }], "APROBADO")
    );
    prismaMock.versionDocumento.create.mockResolvedValue({ id: "v2", numeroVersion: 2 });
    prismaMock.documento.update.mockResolvedValue({});

    await crearNuevaVersion("doc-1", { cambios: "Actualiza referencias" }, "user-1");

    expect(prismaMock.versionDocumento.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        documentoId: "doc-1",
        numeroVersion: 2,
        estado: "BORRADOR",
        creadoPorId: "user-1",
        cambios: "Actualiza referencias",
      }),
    });
    expect(prismaMock.documento.update).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      data: { estado: "BORRADOR" },
    });
  });
});
