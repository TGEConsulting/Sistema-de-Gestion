import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarObjetivoSchema,
  crearObjetivoSchema,
  listarObjetivosQuerySchema,
} from "./objetivos.validators";
import * as objetivosController from "./objetivos.controller";

export const objetivosRouter = Router();

objetivosRouter.use(authMiddleware);

objetivosRouter.get(
  "/",
  requirePermiso("OBJETIVOS", "VER"),
  validate(listarObjetivosQuerySchema, "query"),
  asyncHandler(objetivosController.listar)
);
objetivosRouter.get("/:id", requirePermiso("OBJETIVOS", "VER"), asyncHandler(objetivosController.obtener));
objetivosRouter.post(
  "/",
  requirePermiso("OBJETIVOS", "EDITAR"),
  validate(crearObjetivoSchema),
  asyncHandler(objetivosController.crear)
);
objetivosRouter.put(
  "/:id",
  requirePermiso("OBJETIVOS", "EDITAR"),
  validate(actualizarObjetivoSchema),
  asyncHandler(objetivosController.actualizar)
);
objetivosRouter.delete("/:id", requirePermiso("OBJETIVOS", "APROBAR"), asyncHandler(objetivosController.eliminar));
