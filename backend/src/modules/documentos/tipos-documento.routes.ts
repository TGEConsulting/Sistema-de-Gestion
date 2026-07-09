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

export const tiposDocumentoRouter = Router();

tiposDocumentoRouter.use(authMiddleware);

tiposDocumentoRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.tipoDocumento.findMany({ orderBy: { nombre: "asc" } }));
  })
);

tiposDocumentoRouter.post(
  "/",
  requireRole("ADMIN"),
  validate(crearSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.tipoDocumento.create({ data: req.body }));
  })
);

tiposDocumentoRouter.put(
  "/:id",
  requireRole("ADMIN"),
  validate(crearSchema.partial()),
  asyncHandler(async (req, res) => {
    const existente = await prisma.tipoDocumento.findUnique({ where: { id: req.params.id } });
    if (!existente) throw AppError.notFound("Tipo de documento no encontrado");
    res.json(await prisma.tipoDocumento.update({ where: { id: req.params.id }, data: req.body }));
  })
);

tiposDocumentoRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const enUso = await prisma.documento.count({ where: { tipoDocumentoId: req.params.id, deletedAt: null } });
    if (enUso > 0) throw AppError.conflict("No se puede eliminar: hay documentos usando este tipo");
    await prisma.tipoDocumento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
