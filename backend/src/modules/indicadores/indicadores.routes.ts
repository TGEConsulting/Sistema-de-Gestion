import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarIndicadorSchema,
  crearIndicadorSchema,
  crearRegistroSchema,
  listarIndicadoresQuerySchema,
} from "./indicadores.validators";
import * as indicadoresController from "./indicadores.controller";

export const indicadoresRouter = Router();

indicadoresRouter.use(authMiddleware);

indicadoresRouter.get(
  "/",
  requirePermiso("INDICADORES", "VER"),
  validate(listarIndicadoresQuerySchema, "query"),
  asyncHandler(indicadoresController.listar)
);
indicadoresRouter.get(
  "/export",
  requirePermiso("INDICADORES", "VER"),
  validate(listarIndicadoresQuerySchema, "query"),
  asyncHandler(indicadoresController.exportar)
);
indicadoresRouter.get("/:id", requirePermiso("INDICADORES", "VER"), asyncHandler(indicadoresController.obtener));
indicadoresRouter.post(
  "/",
  requirePermiso("INDICADORES", "EDITAR"),
  validate(crearIndicadorSchema),
  asyncHandler(indicadoresController.crear)
);
indicadoresRouter.put(
  "/:id",
  requirePermiso("INDICADORES", "EDITAR"),
  validate(actualizarIndicadorSchema),
  asyncHandler(indicadoresController.actualizar)
);
indicadoresRouter.delete(
  "/:id",
  requirePermiso("INDICADORES", "APROBAR"),
  asyncHandler(indicadoresController.eliminar)
);

indicadoresRouter.post(
  "/:id/registros",
  requirePermiso("INDICADORES", "EDITAR"),
  validate(crearRegistroSchema),
  asyncHandler(indicadoresController.registrarValor)
);
