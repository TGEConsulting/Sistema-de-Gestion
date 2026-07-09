import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarAreaSchema,
  crearAreaSchema,
  listarAreasQuerySchema,
} from "@/modules/personas/areas.validators";
import * as areasController from "@/modules/personas/areas.controller";

export const areasRouter = Router();

areasRouter.use(authMiddleware);

areasRouter.get("/", validate(listarAreasQuerySchema, "query"), asyncHandler(areasController.listar));
areasRouter.get("/:id", asyncHandler(areasController.obtener));
areasRouter.post(
  "/",
  requireRole("ADMIN"),
  validate(crearAreaSchema),
  asyncHandler(areasController.crear)
);
areasRouter.put(
  "/:id",
  requireRole("ADMIN"),
  validate(actualizarAreaSchema),
  asyncHandler(areasController.actualizar)
);
areasRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(areasController.eliminar));
