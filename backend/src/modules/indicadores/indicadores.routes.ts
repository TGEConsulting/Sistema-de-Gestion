import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarIndicadorSchema,
  crearIndicadorSchema,
  crearRegistroSchema,
  listarIndicadoresQuerySchema,
} from "@/modules/indicadores/indicadores.validators";
import * as indicadoresController from "@/modules/indicadores/indicadores.controller";

export const indicadoresRouter = Router();

indicadoresRouter.use(authMiddleware);

indicadoresRouter.get(
  "/",
  validate(listarIndicadoresQuerySchema, "query"),
  asyncHandler(indicadoresController.listar)
);
indicadoresRouter.get(
  "/export",
  validate(listarIndicadoresQuerySchema, "query"),
  asyncHandler(indicadoresController.exportar)
);
indicadoresRouter.get("/:id", asyncHandler(indicadoresController.obtener));
indicadoresRouter.post(
  "/",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearIndicadorSchema),
  asyncHandler(indicadoresController.crear)
);
indicadoresRouter.put(
  "/:id",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarIndicadorSchema),
  asyncHandler(indicadoresController.actualizar)
);
indicadoresRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(indicadoresController.eliminar)
);

indicadoresRouter.post(
  "/:id/registros",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearRegistroSchema),
  asyncHandler(indicadoresController.registrarValor)
);
