import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";

const crearSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
});

export const categoriasRiesgoRouter = Router();

categoriasRiesgoRouter.use(authMiddleware);

categoriasRiesgoRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.categoriaRiesgo.findMany({ orderBy: { nombre: "asc" } }));
  })
);

categoriasRiesgoRouter.post(
  "/",
  requireRole("ADMIN"),
  validate(crearSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.categoriaRiesgo.create({ data: req.body }));
  })
);

categoriasRiesgoRouter.put(
  "/:id",
  requireRole("ADMIN"),
  validate(crearSchema.partial()),
  asyncHandler(async (req, res) => {
    const existente = await prisma.categoriaRiesgo.findUnique({ where: { id: req.params.id } });
    if (!existente) throw AppError.notFound("Categoría de riesgo no encontrada");
    res.json(await prisma.categoriaRiesgo.update({ where: { id: req.params.id }, data: req.body }));
  })
);

categoriasRiesgoRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const enUso = await prisma.riesgo.count({ where: { categoriaId: req.params.id, deletedAt: null } });
    if (enUso > 0) throw AppError.conflict("No se puede eliminar: hay riesgos usando esta categoría");
    await prisma.categoriaRiesgo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
