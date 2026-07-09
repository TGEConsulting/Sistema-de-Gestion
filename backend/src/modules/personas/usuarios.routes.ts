import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";
import {
  actualizarUsuarioSchema,
  cambiarPasswordSchema,
  crearUsuarioSchema,
} from "./usuarios.validators";
import * as usuariosController from "./usuarios.controller";

export const usuariosRouter = Router();

usuariosRouter.use(authMiddleware);

// Lectura disponible para cualquier usuario autenticado: se necesita para poblar
// selectores de "responsable" al crear documentos, riesgos, NC, objetivos, etc.
usuariosRouter.get("/", asyncHandler(usuariosController.listar));
usuariosRouter.get("/:id", asyncHandler(usuariosController.obtener));

usuariosRouter.post(
  "/",
  requireRole("ADMIN"),
  validate(crearUsuarioSchema),
  asyncHandler(usuariosController.crear)
);
usuariosRouter.put(
  "/:id",
  requireRole("ADMIN"),
  validate(actualizarUsuarioSchema),
  asyncHandler(usuariosController.actualizar)
);
usuariosRouter.put(
  "/:id/password",
  requireRole("ADMIN"),
  validate(cambiarPasswordSchema),
  asyncHandler(usuariosController.cambiarPassword)
);
usuariosRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(usuariosController.eliminar));
