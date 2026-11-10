import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarRequisitoSchema,
  crearRequisitoSchema,
  evaluarRequisitoSchema,
  listarRequisitosQuerySchema,
} from "./requisitos.validators";
import * as controller from "./requisitos.controller";

export const requisitosRouter = Router();

requisitosRouter.use(authMiddleware);

requisitosRouter.get("/", requirePermiso("REQUISITOS", "VER"), validate(listarRequisitosQuerySchema, "query"), asyncHandler(controller.listar));
requisitosRouter.get("/resumen", requirePermiso("REQUISITOS", "VER"), asyncHandler(controller.resumen));
requisitosRouter.get("/export", requirePermiso("REQUISITOS", "VER"), validate(listarRequisitosQuerySchema, "query"), asyncHandler(controller.exportar));
requisitosRouter.get("/:id", requirePermiso("REQUISITOS", "VER"), asyncHandler(controller.obtener));
requisitosRouter.post("/", requirePermiso("REQUISITOS", "EDITAR"), validate(crearRequisitoSchema), asyncHandler(controller.crear));
requisitosRouter.put("/:id", requirePermiso("REQUISITOS", "EDITAR"), validate(actualizarRequisitoSchema), asyncHandler(controller.actualizar));
requisitosRouter.post("/:id/evaluar", requirePermiso("REQUISITOS", "EDITAR"), validate(evaluarRequisitoSchema), asyncHandler(controller.evaluar));
requisitosRouter.delete("/:id", requirePermiso("REQUISITOS", "APROBAR"), asyncHandler(controller.eliminar));
