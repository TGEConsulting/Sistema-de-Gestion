import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarProveedorSchema,
  crearDocumentoProveedorSchema,
  crearEvaluacionSchema,
  crearProveedorSchema,
  listarProveedoresQuerySchema,
} from "./proveedores.validators";
import * as proveedoresController from "./proveedores.controller";

export const proveedoresRouter = Router();

proveedoresRouter.use(authMiddleware);

proveedoresRouter.get(
  "/",
  requirePermiso("PROVEEDORES", "VER"),
  validate(listarProveedoresQuerySchema, "query"),
  asyncHandler(proveedoresController.listar)
);
proveedoresRouter.get("/:id", requirePermiso("PROVEEDORES", "VER"), asyncHandler(proveedoresController.obtener));
proveedoresRouter.post(
  "/",
  requirePermiso("PROVEEDORES", "EDITAR"),
  validate(crearProveedorSchema),
  asyncHandler(proveedoresController.crear)
);
proveedoresRouter.put(
  "/:id",
  requirePermiso("PROVEEDORES", "EDITAR"),
  validate(actualizarProveedorSchema),
  asyncHandler(proveedoresController.actualizar)
);
proveedoresRouter.delete(
  "/:id",
  requirePermiso("PROVEEDORES", "APROBAR"),
  asyncHandler(proveedoresController.eliminar)
);

proveedoresRouter.post(
  "/:id/evaluaciones",
  requirePermiso("PROVEEDORES", "EDITAR"),
  validate(crearEvaluacionSchema),
  asyncHandler(proveedoresController.agregarEvaluacion)
);
proveedoresRouter.post(
  "/:id/documentos",
  requirePermiso("PROVEEDORES", "EDITAR"),
  validate(crearDocumentoProveedorSchema),
  asyncHandler(proveedoresController.agregarDocumento)
);
