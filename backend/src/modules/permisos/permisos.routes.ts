import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";
import { actualizarMatrizSchema } from "./permisos.validators";
import * as permisosController from "./permisos.controller";

export const permisosRouter = Router();

permisosRouter.use(authMiddleware);
// Administrar la matriz de permisos es en sí mismo un permiso sensible: se mantiene con
// requireRole("ADMIN") clásico en vez de requirePermiso, para evitar un problema de
// huevo-y-gallina (nadie podría des-configurar su propio acceso a esta pantalla).
permisosRouter.use(requireRole("ADMIN"));

permisosRouter.get("/", asyncHandler(permisosController.obtener));
permisosRouter.put("/", validate(actualizarMatrizSchema), asyncHandler(permisosController.actualizar));
