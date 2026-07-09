import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarPersonaSchema,
  crearPersonaSchema,
  listarPersonasQuerySchema,
} from "./personas.validators";
import * as personasController from "./personas.controller";

export const personasRouter = Router();

personasRouter.use(authMiddleware);

personasRouter.get(
  "/",
  requirePermiso("PERSONAS", "VER"),
  validate(listarPersonasQuerySchema, "query"),
  asyncHandler(personasController.listar)
);
personasRouter.get("/:id", requirePermiso("PERSONAS", "VER"), asyncHandler(personasController.obtener));
personasRouter.post(
  "/",
  requirePermiso("PERSONAS", "EDITAR"),
  validate(crearPersonaSchema),
  asyncHandler(personasController.crear)
);
personasRouter.put(
  "/:id",
  requirePermiso("PERSONAS", "EDITAR"),
  validate(actualizarPersonaSchema),
  asyncHandler(personasController.actualizar)
);
personasRouter.delete("/:id", requirePermiso("PERSONAS", "APROBAR"), asyncHandler(personasController.eliminar));
