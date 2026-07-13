import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarCambioSchema,
  crearCambioSchema,
  implementarCambioSchema,
  listarCambiosQuerySchema,
} from "./cambios.validators";
import * as cambiosController from "./cambios.controller";

export const cambiosRouter = Router();

cambiosRouter.use(authMiddleware);

cambiosRouter.get(
  "/",
  requirePermiso("GESTION_CAMBIOS", "VER"),
  validate(listarCambiosQuerySchema, "query"),
  asyncHandler(cambiosController.listar)
);
cambiosRouter.get(
  "/export",
  requirePermiso("GESTION_CAMBIOS", "VER"),
  validate(listarCambiosQuerySchema, "query"),
  asyncHandler(cambiosController.exportar)
);
cambiosRouter.get("/:id", requirePermiso("GESTION_CAMBIOS", "VER"), asyncHandler(cambiosController.obtener));

cambiosRouter.post(
  "/",
  requirePermiso("GESTION_CAMBIOS", "EDITAR"),
  validate(crearCambioSchema),
  asyncHandler(cambiosController.crear)
);
cambiosRouter.put(
  "/:id",
  requirePermiso("GESTION_CAMBIOS", "EDITAR"),
  validate(actualizarCambioSchema),
  asyncHandler(cambiosController.actualizar)
);
cambiosRouter.delete(
  "/:id",
  requirePermiso("GESTION_CAMBIOS", "APROBAR"),
  asyncHandler(cambiosController.eliminar)
);

cambiosRouter.post(
  "/:id/comunicar",
  requirePermiso("GESTION_CAMBIOS", "APROBAR"),
  asyncHandler(cambiosController.comunicar)
);
cambiosRouter.post(
  "/:id/implementar",
  requirePermiso("GESTION_CAMBIOS", "EDITAR"),
  validate(implementarCambioSchema),
  asyncHandler(cambiosController.implementar)
);
cambiosRouter.post(
  "/:id/cancelar",
  requirePermiso("GESTION_CAMBIOS", "EDITAR"),
  asyncHandler(cambiosController.cancelar)
);
