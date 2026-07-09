import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarPuestoSchema,
  crearPuestoSchema,
  listarPuestosQuerySchema,
} from "@/modules/personas/puestos.validators";
import * as puestosController from "@/modules/personas/puestos.controller";

export const puestosRouter = Router();

puestosRouter.use(authMiddleware);

puestosRouter.get(
  "/",
  validate(listarPuestosQuerySchema, "query"),
  asyncHandler(puestosController.listar)
);
puestosRouter.get("/:id", asyncHandler(puestosController.obtener));
puestosRouter.post(
  "/",
  requireRole("ADMIN"),
  validate(crearPuestoSchema),
  asyncHandler(puestosController.crear)
);
puestosRouter.put(
  "/:id",
  requireRole("ADMIN"),
  validate(actualizarPuestoSchema),
  asyncHandler(puestosController.actualizar)
);
puestosRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(puestosController.eliminar));
