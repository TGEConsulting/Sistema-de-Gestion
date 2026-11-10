import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import { actualizarInterfazSchema, crearInterfazSchema, listarInterfacesQuerySchema, revisarInterfazSchema } from "./matriz.validators";
import * as controller from "./matriz.controller";

export const matrizComunicacionRouter = Router();

matrizComunicacionRouter.use(authMiddleware);

matrizComunicacionRouter.get("/", requirePermiso("MATRIZ_COMUNICACION", "VER"), validate(listarInterfacesQuerySchema, "query"), asyncHandler(controller.listar));
matrizComunicacionRouter.get("/resumen", requirePermiso("MATRIZ_COMUNICACION", "VER"), asyncHandler(controller.resumen));
matrizComunicacionRouter.get("/export", requirePermiso("MATRIZ_COMUNICACION", "VER"), validate(listarInterfacesQuerySchema, "query"), asyncHandler(controller.exportar));
matrizComunicacionRouter.get("/:id", requirePermiso("MATRIZ_COMUNICACION", "VER"), asyncHandler(controller.obtener));
matrizComunicacionRouter.post("/", requirePermiso("MATRIZ_COMUNICACION", "EDITAR"), validate(crearInterfazSchema), asyncHandler(controller.crear));
matrizComunicacionRouter.put("/:id", requirePermiso("MATRIZ_COMUNICACION", "EDITAR"), validate(actualizarInterfazSchema), asyncHandler(controller.actualizar));
matrizComunicacionRouter.post("/:id/revisar", requirePermiso("MATRIZ_COMUNICACION", "EDITAR"), validate(revisarInterfazSchema), asyncHandler(controller.revisar));
matrizComunicacionRouter.delete("/:id", requirePermiso("MATRIZ_COMUNICACION", "APROBAR"), asyncHandler(controller.eliminar));
