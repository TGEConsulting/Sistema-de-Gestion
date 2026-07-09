import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";

export const notificacionesRouter = Router();

notificacionesRouter.use(authMiddleware);

notificacionesRouter.get(
  "/",
  validate(z.object({ leida: z.coerce.boolean().optional() }), "query"),
  asyncHandler(async (req, res) => {
    if (!req.auth) throw AppError.unauthorized();
    const { leida } = req.query as { leida?: boolean };
    res.json(
      await prisma.notificacion.findMany({
        where: { usuarioId: req.auth.sub, ...(leida !== undefined ? { leida } : {}) },
        orderBy: { createdAt: "desc" },
      })
    );
  })
);

notificacionesRouter.put(
  "/:id/leida",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw AppError.unauthorized();
    const notificacion = await prisma.notificacion.findFirst({
      where: { id: req.params.id, usuarioId: req.auth.sub },
    });
    if (!notificacion) throw AppError.notFound("Notificación no encontrada");
    res.json(
      await prisma.notificacion.update({ where: { id: req.params.id }, data: { leida: true } })
    );
  })
);

notificacionesRouter.put(
  "/marcar-todas-leidas",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw AppError.unauthorized();
    await prisma.notificacion.updateMany({
      where: { usuarioId: req.auth.sub, leida: false },
      data: { leida: true },
    });
    res.status(204).send();
  })
);
