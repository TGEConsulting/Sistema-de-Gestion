import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarProveedorSchema,
  crearDocumentoProveedorSchema,
  crearEvaluacionSchema,
  crearProveedorSchema,
  listarProveedoresQuerySchema,
} from "@/modules/proveedores/proveedores.validators";
import * as proveedoresController from "@/modules/proveedores/proveedores.controller";

export const proveedoresRouter = Router();

proveedoresRouter.use(authMiddleware);

proveedoresRouter.get(
  "/",
  validate(listarProveedoresQuerySchema, "query"),
  asyncHandler(proveedoresController.listar)
);
proveedoresRouter.get("/:id", asyncHandler(proveedoresController.obtener));
proveedoresRouter.post(
  "/",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearProveedorSchema),
  asyncHandler(proveedoresController.crear)
);
proveedoresRouter.put(
  "/:id",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarProveedorSchema),
  asyncHandler(proveedoresController.actualizar)
);
proveedoresRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(proveedoresController.eliminar)
);

proveedoresRouter.post(
  "/:id/evaluaciones",
  requireRole("ADMIN", "AUDITOR", "RESPONSABLE_PROCESO"),
  validate(crearEvaluacionSchema),
  asyncHandler(proveedoresController.agregarEvaluacion)
);
proveedoresRouter.post(
  "/:id/documentos",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearDocumentoProveedorSchema),
  asyncHandler(proveedoresController.agregarDocumento)
);
