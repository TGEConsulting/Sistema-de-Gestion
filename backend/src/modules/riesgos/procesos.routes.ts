import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";

const crearSchema = z.object({
  nombre: z.string().min(2),
  areaId: z.string().min(1),
  responsableId: z.string().optional(),
});

export const procesosRouter = Router();

procesosRouter.use(authMiddleware);

procesosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { areaId } = req.query as { areaId?: string };
    res.json(
      await prisma.proceso.findMany({
        where: { activo: true, ...(areaId ? { areaId } : {}) },
        include: { area: true },
        orderBy: { nombre: "asc" },
      })
    );
  })
);

procesosRouter.post(
  "/",
  requireRole("ADMIN"),
  validate(crearSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.proceso.create({ data: req.body }));
  })
);

procesosRouter.put(
  "/:id",
  requireRole("ADMIN"),
  validate(crearSchema.partial().extend({ activo: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    const existente = await prisma.proceso.findUnique({ where: { id: req.params.id } });
    if (!existente) throw AppError.notFound("Proceso no encontrado");
    res.json(await prisma.proceso.update({ where: { id: req.params.id }, data: req.body }));
  })
);

procesosRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const existente = await prisma.proceso.findUnique({ where: { id: req.params.id } });
    if (!existente) throw AppError.notFound("Proceso no encontrado");
    await prisma.proceso.update({ where: { id: req.params.id }, data: { activo: false } });
    res.status(204).send();
  })
);
