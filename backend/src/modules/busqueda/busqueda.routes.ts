import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";

export const busquedaRouter = Router();

busquedaRouter.use(authMiddleware);

export interface ResultadoBusqueda {
  tipo: "Documento" | "Riesgo" | "NoConformidad" | "Auditoria" | "Proveedor";
  id: string;
  titulo: string;
  subtitulo: string;
  ruta: string;
}

const LIMITE_POR_TIPO = 5;

busquedaRouter.get(
  "/",
  validate(z.object({ q: z.string().min(2) }), "query"),
  asyncHandler(async (req, res) => {
    const { q } = req.query as { q: string };
    const contains = { contains: q, mode: "insensitive" as const };

    const [documentos, riesgos, noConformidades, auditorias, proveedores] = await Promise.all([
      prisma.documento.findMany({
        where: { deletedAt: null, OR: [{ titulo: contains }, { codigo: contains }] },
        take: LIMITE_POR_TIPO,
      }),
      prisma.riesgo.findMany({
        where: { deletedAt: null, OR: [{ descripcion: contains }, { codigo: contains }] },
        take: LIMITE_POR_TIPO,
      }),
      prisma.noConformidad.findMany({
        where: { deletedAt: null, OR: [{ descripcion: contains }, { codigo: contains }] },
        take: LIMITE_POR_TIPO,
      }),
      prisma.auditoria.findMany({
        where: { deletedAt: null, alcance: contains },
        take: LIMITE_POR_TIPO,
      }),
      prisma.proveedor.findMany({
        where: { deletedAt: null, nombre: contains },
        take: LIMITE_POR_TIPO,
      }),
    ]);

    const resultados: ResultadoBusqueda[] = [
      ...documentos.map((d) => ({
        tipo: "Documento" as const,
        id: d.id,
        titulo: d.titulo,
        subtitulo: d.codigo,
        ruta: "/documentos",
      })),
      ...riesgos.map((r) => ({
        tipo: "Riesgo" as const,
        id: r.id,
        titulo: r.descripcion,
        subtitulo: r.codigo,
        ruta: "/riesgos",
      })),
      ...noConformidades.map((n) => ({
        tipo: "NoConformidad" as const,
        id: n.id,
        titulo: n.descripcion,
        subtitulo: n.codigo,
        ruta: "/no-conformidades",
      })),
      ...auditorias.map((a) => ({
        tipo: "Auditoria" as const,
        id: a.id,
        titulo: a.alcance,
        subtitulo: a.tipo,
        ruta: "/auditorias",
      })),
      ...proveedores.map((p) => ({
        tipo: "Proveedor" as const,
        id: p.id,
        titulo: p.nombre,
        subtitulo: p.tipo,
        ruta: "/proveedores",
      })),
    ];

    res.json(resultados);
  })
);
