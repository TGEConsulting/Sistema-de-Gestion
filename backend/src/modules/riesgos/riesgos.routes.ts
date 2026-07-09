import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarRiesgoSchema,
  actualizarTratamientoSchema,
  crearRiesgoSchema,
  crearTratamientoSchema,
  listarRiesgosQuerySchema,
} from "@/modules/riesgos/riesgos.validators";
import * as riesgosController from "@/modules/riesgos/riesgos.controller";

export const riesgosRouter = Router();

riesgosRouter.use(authMiddleware);

riesgosRouter.get(
  "/",
  validate(listarRiesgosQuerySchema, "query"),
  asyncHandler(riesgosController.listar)
);
riesgosRouter.get(
  "/export",
  validate(listarRiesgosQuerySchema, "query"),
  asyncHandler(riesgosController.exportar)
);
riesgosRouter.get("/:id", asyncHandler(riesgosController.obtener));
riesgosRouter.post(
  "/",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearRiesgoSchema),
  asyncHandler(riesgosController.crear)
);
riesgosRouter.put(
  "/:id",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarRiesgoSchema),
  asyncHandler(riesgosController.actualizar)
);
riesgosRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(riesgosController.eliminar));

riesgosRouter.post(
  "/:id/tratamientos",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearTratamientoSchema),
  asyncHandler(riesgosController.agregarTratamiento)
);
riesgosRouter.put(
  "/:id/tratamientos/:tratamientoId",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarTratamientoSchema),
  asyncHandler(riesgosController.actualizarTratamiento)
);
