import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";
import { actualizarPlanSchema, crearPlanSchema } from "./planes.validators";

export const planesRouter = Router();

planesRouter.use(authMiddleware);

planesRouter.get(
  "/",
  validate(z.object({ objetivoId: z.string().optional() }), "query"),
  asyncHandler(async (req, res) => {
    const { objetivoId } = req.query as { objetivoId?: string };
    res.json(
      await prisma.plan.findMany({
        where: { deletedAt: null, ...(objetivoId ? { objetivoId } : {}) },
        include: { responsable: { select: { id: true, nombre: true } }, actividades: true },
        orderBy: { fechaInicio: "asc" },
      })
    );
  })
);

planesRouter.post(
  "/",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearPlanSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.plan.create({ data: req.body }));
  })
);

planesRouter.put(
  "/:id",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarPlanSchema),
  asyncHandler(async (req, res) => {
    const existente = await prisma.plan.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existente) throw AppError.notFound("Plan no encontrado");
    res.json(await prisma.plan.update({ where: { id: req.params.id }, data: req.body }));
  })
);

planesRouter.delete(
  "/:id",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  asyncHandler(async (req, res) => {
    const existente = await prisma.plan.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existente) throw AppError.notFound("Plan no encontrado");
    await prisma.plan.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  })
);
