import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";

const crearSchema = z.object({
  anio: z.number().int().min(2000).max(2100),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
});

export const programasAuditoriaRouter = Router();

programasAuditoriaRouter.use(authMiddleware);

programasAuditoriaRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { anio } = req.query as { anio?: string };
    res.json(
      await prisma.programaAuditoria.findMany({
        where: anio ? { anio: Number(anio) } : {},
        orderBy: { anio: "desc" },
      })
    );
  })
);

programasAuditoriaRouter.post(
  "/",
  requireRole("ADMIN", "AUDITOR"),
  validate(crearSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.programaAuditoria.create({ data: req.body }));
  })
);

programasAuditoriaRouter.put(
  "/:id",
  requireRole("ADMIN", "AUDITOR"),
  validate(crearSchema.partial()),
  asyncHandler(async (req, res) => {
    const existente = await prisma.programaAuditoria.findUnique({ where: { id: req.params.id } });
    if (!existente) throw AppError.notFound("Programa de auditoría no encontrado");
    res.json(await prisma.programaAuditoria.update({ where: { id: req.params.id }, data: req.body }));
  })
);

programasAuditoriaRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const existente = await prisma.programaAuditoria.findUnique({ where: { id: req.params.id } });
    if (!existente) throw AppError.notFound("Programa de auditoría no encontrado");
    await prisma.programaAuditoria.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
