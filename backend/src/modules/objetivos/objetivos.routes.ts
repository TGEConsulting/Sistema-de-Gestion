import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarObjetivoSchema,
  crearObjetivoSchema,
  listarObjetivosQuerySchema,
} from "@/modules/objetivos/objetivos.validators";
import * as objetivosController from "@/modules/objetivos/objetivos.controller";

export const objetivosRouter = Router();

objetivosRouter.use(authMiddleware);

objetivosRouter.get(
  "/",
  validate(listarObjetivosQuerySchema, "query"),
  asyncHandler(objetivosController.listar)
);
objetivosRouter.get("/:id", asyncHandler(objetivosController.obtener));
objetivosRouter.post(
  "/",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearObjetivoSchema),
  asyncHandler(objetivosController.crear)
);
objetivosRouter.put(
  "/:id",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarObjetivoSchema),
  asyncHandler(objetivosController.actualizar)
);
objetivosRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(objetivosController.eliminar));
