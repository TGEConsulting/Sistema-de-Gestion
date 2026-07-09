import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarAccionSchema,
  actualizarNCSchema,
  crearAccionSchema,
  crearNCSchema,
  listarNCQuerySchema,
} from "@/modules/noconformidades/nc.validators";
import * as ncController from "@/modules/noconformidades/nc.controller";

export const ncRouter = Router();

ncRouter.use(authMiddleware);

ncRouter.get("/", validate(listarNCQuerySchema, "query"), asyncHandler(ncController.listar));
ncRouter.get(
  "/export",
  validate(listarNCQuerySchema, "query"),
  asyncHandler(ncController.exportar)
);
ncRouter.get("/:id", asyncHandler(ncController.obtener));
ncRouter.post(
  "/",
  requireRole("ADMIN", "AUDITOR", "RESPONSABLE_PROCESO"),
  validate(crearNCSchema),
  asyncHandler(ncController.crear)
);
ncRouter.put(
  "/:id",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarNCSchema),
  asyncHandler(ncController.actualizar)
);
ncRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(ncController.eliminar));

ncRouter.post(
  "/:id/cerrar",
  requireRole("ADMIN", "AUDITOR"),
  validate(z.object({ evidenciaCierre: z.string().min(3) })),
  asyncHandler(ncController.cerrar)
);

ncRouter.post(
  "/:id/acciones",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearAccionSchema),
  asyncHandler(ncController.agregarAccion)
);
ncRouter.put(
  "/:id/acciones/:accionId",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarAccionSchema),
  asyncHandler(ncController.actualizarAccion)
);
