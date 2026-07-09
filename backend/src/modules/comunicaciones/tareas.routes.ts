import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";

const actualizarTareaSchema = z.object({
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "COMPLETADA", "VENCIDA"]),
});

export const tareasRouter = Router();

tareasRouter.use(authMiddleware);

tareasRouter.get(
  "/",
  requirePermiso("COMUNICACIONES", "VER"),
  validate(z.object({ estado: z.string().optional() }), "query"),
  asyncHandler(async (req, res) => {
    if (!req.auth) throw AppError.unauthorized();
    const { estado } = req.query as { estado?: string };
    res.json(
      await prisma.tarea.findMany({
        where: { asignadoAId: req.auth.sub, ...(estado ? { estado: estado as never } : {}) },
        orderBy: { fechaVencimiento: "asc" },
      })
    );
  })
);

tareasRouter.put(
  "/:id",
  requirePermiso("COMUNICACIONES", "EDITAR"),
  validate(actualizarTareaSchema),
  asyncHandler(async (req, res) => {
    if (!req.auth) throw AppError.unauthorized();
    const tarea = await prisma.tarea.findFirst({
      where: { id: req.params.id, asignadoAId: req.auth.sub },
    });
    if (!tarea) throw AppError.notFound("Tarea no encontrada");
    res.json(await prisma.tarea.update({ where: { id: req.params.id }, data: req.body }));
  })
);
