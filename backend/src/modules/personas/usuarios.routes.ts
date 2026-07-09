import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarUsuarioSchema,
  cambiarPasswordSchema,
  crearUsuarioSchema,
} from "./usuarios.validators";
import * as usuariosController from "./usuarios.controller";

export const usuariosRouter = Router();

usuariosRouter.use(authMiddleware);

// Lectura disponible para cualquier usuario autenticado (sin gate de la matriz de permisos):
// se necesita para poblar selectores de "responsable" al crear documentos, riesgos, NC,
// objetivos, etc. en TODOS los módulos, no solo en Personas.
usuariosRouter.get("/", asyncHandler(usuariosController.listar));
usuariosRouter.get("/:id", asyncHandler(usuariosController.obtener));

usuariosRouter.post(
  "/",
  requirePermiso("PERSONAS", "EDITAR"),
  validate(crearUsuarioSchema),
  asyncHandler(usuariosController.crear)
);
usuariosRouter.put(
  "/:id",
  requirePermiso("PERSONAS", "EDITAR"),
  validate(actualizarUsuarioSchema),
  asyncHandler(usuariosController.actualizar)
);
usuariosRouter.put(
  "/:id/password",
  requirePermiso("PERSONAS", "APROBAR"),
  validate(cambiarPasswordSchema),
  asyncHandler(usuariosController.cambiarPassword)
);
usuariosRouter.delete("/:id", requirePermiso("PERSONAS", "APROBAR"), asyncHandler(usuariosController.eliminar));
