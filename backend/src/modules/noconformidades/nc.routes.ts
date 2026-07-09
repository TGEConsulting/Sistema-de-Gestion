import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarAccionSchema,
  actualizarNCSchema,
  crearAccionSchema,
  crearNCSchema,
  listarNCQuerySchema,
} from "./nc.validators";
import * as ncController from "./nc.controller";

export const ncRouter = Router();

ncRouter.use(authMiddleware);

ncRouter.get(
  "/",
  requirePermiso("NO_CONFORMIDADES", "VER"),
  validate(listarNCQuerySchema, "query"),
  asyncHandler(ncController.listar)
);
ncRouter.get(
  "/export",
  requirePermiso("NO_CONFORMIDADES", "VER"),
  validate(listarNCQuerySchema, "query"),
  asyncHandler(ncController.exportar)
);
ncRouter.get("/:id", requirePermiso("NO_CONFORMIDADES", "VER"), asyncHandler(ncController.obtener));
ncRouter.post(
  "/",
  requirePermiso("NO_CONFORMIDADES", "EDITAR"),
  validate(crearNCSchema),
  asyncHandler(ncController.crear)
);
ncRouter.put(
  "/:id",
  requirePermiso("NO_CONFORMIDADES", "EDITAR"),
  validate(actualizarNCSchema),
  asyncHandler(ncController.actualizar)
);
ncRouter.delete("/:id", requirePermiso("NO_CONFORMIDADES", "APROBAR"), asyncHandler(ncController.eliminar));

ncRouter.post(
  "/:id/cerrar",
  requirePermiso("NO_CONFORMIDADES", "APROBAR"),
  validate(z.object({ evidenciaCierre: z.string().min(3) })),
  asyncHandler(ncController.cerrar)
);

ncRouter.post(
  "/:id/acciones",
  requirePermiso("NO_CONFORMIDADES", "EDITAR"),
  validate(crearAccionSchema),
  asyncHandler(ncController.agregarAccion)
);
ncRouter.put(
  "/:id/acciones/:accionId",
  requirePermiso("NO_CONFORMIDADES", "EDITAR"),
  validate(actualizarAccionSchema),
  asyncHandler(ncController.actualizarAccion)
);
