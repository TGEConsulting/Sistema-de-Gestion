import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarActividadSchema,
  crearActividadSchema,
} from "./actividades.validators";

export const actividadesRouter = Router();

actividadesRouter.use(authMiddleware);

actividadesRouter.get(
  "/",
  requirePermiso("OBJETIVOS", "VER"),
  validate(z.object({ planId: z.string().optional() }), "query"),
  asyncHandler(async (req, res) => {
    const { planId } = req.query as { planId?: string };
    res.json(
      await prisma.actividad.findMany({
        where: { deletedAt: null, ...(planId ? { planId } : {}) },
        include: { responsable: { select: { id: true, nombre: true } } },
        orderBy: { fechaInicio: "asc" },
      })
    );
  })
);

actividadesRouter.post(
  "/",
  requirePermiso("OBJETIVOS", "EDITAR"),
  validate(crearActividadSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.actividad.create({ data: req.body }));
  })
);

actividadesRouter.put(
  "/:id",
  requirePermiso("OBJETIVOS", "EDITAR"),
  validate(actualizarActividadSchema),
  asyncHandler(async (req, res) => {
    const existente = await prisma.actividad.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existente) throw AppError.notFound("Actividad no encontrada");
    res.json(await prisma.actividad.update({ where: { id: req.params.id }, data: req.body }));
  })
);

actividadesRouter.delete(
  "/:id",
  requirePermiso("OBJETIVOS", "APROBAR"),
  asyncHandler(async (req, res) => {
    const existente = await prisma.actividad.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existente) throw AppError.notFound("Actividad no encontrada");
    await prisma.actividad.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  })
);
