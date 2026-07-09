import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarRiesgoSchema,
  actualizarTratamientoSchema,
  crearRiesgoSchema,
  crearTratamientoSchema,
  listarRiesgosQuerySchema,
} from "./riesgos.validators";
import * as riesgosController from "./riesgos.controller";

export const riesgosRouter = Router();

riesgosRouter.use(authMiddleware);

riesgosRouter.get(
  "/",
  requirePermiso("RIESGOS", "VER"),
  validate(listarRiesgosQuerySchema, "query"),
  asyncHandler(riesgosController.listar)
);
riesgosRouter.get(
  "/export",
  requirePermiso("RIESGOS", "VER"),
  validate(listarRiesgosQuerySchema, "query"),
  asyncHandler(riesgosController.exportar)
);
riesgosRouter.get("/:id", requirePermiso("RIESGOS", "VER"), asyncHandler(riesgosController.obtener));
riesgosRouter.post(
  "/",
  requirePermiso("RIESGOS", "EDITAR"),
  validate(crearRiesgoSchema),
  asyncHandler(riesgosController.crear)
);
riesgosRouter.put(
  "/:id",
  requirePermiso("RIESGOS", "EDITAR"),
  validate(actualizarRiesgoSchema),
  asyncHandler(riesgosController.actualizar)
);
riesgosRouter.delete("/:id", requirePermiso("RIESGOS", "APROBAR"), asyncHandler(riesgosController.eliminar));

riesgosRouter.post(
  "/:id/tratamientos",
  requirePermiso("RIESGOS", "EDITAR"),
  validate(crearTratamientoSchema),
  asyncHandler(riesgosController.agregarTratamiento)
);
riesgosRouter.put(
  "/:id/tratamientos/:tratamientoId",
  requirePermiso("RIESGOS", "EDITAR"),
  validate(actualizarTratamientoSchema),
  asyncHandler(riesgosController.actualizarTratamiento)
);
