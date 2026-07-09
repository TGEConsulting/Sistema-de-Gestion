import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarPersonaSchema,
  crearPersonaSchema,
  listarPersonasQuerySchema,
} from "@/modules/personas/personas.validators";
import * as personasController from "@/modules/personas/personas.controller";

export const personasRouter = Router();

personasRouter.use(authMiddleware);

personasRouter.get(
  "/",
  validate(listarPersonasQuerySchema, "query"),
  asyncHandler(personasController.listar)
);
personasRouter.get("/:id", asyncHandler(personasController.obtener));
personasRouter.post(
  "/",
  requireRole("ADMIN"),
  validate(crearPersonaSchema),
  asyncHandler(personasController.crear)
);
personasRouter.put(
  "/:id",
  requireRole("ADMIN"),
  validate(actualizarPersonaSchema),
  asyncHandler(personasController.actualizar)
);
personasRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(personasController.eliminar));
