import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  actualizarAuditoriaSchema,
  crearAuditoriaSchema,
  crearChecklistSchema,
  crearHallazgoSchema,
  crearInformeSchema,
  listarAuditoriasQuerySchema,
  responderPreguntaSchema,
} from "@/modules/auditorias/auditorias.validators";
import * as auditoriasController from "@/modules/auditorias/auditorias.controller";

export const auditoriasRouter = Router();

auditoriasRouter.use(authMiddleware);

auditoriasRouter.get(
  "/",
  validate(listarAuditoriasQuerySchema, "query"),
  asyncHandler(auditoriasController.listar)
);
auditoriasRouter.get(
  "/export",
  validate(listarAuditoriasQuerySchema, "query"),
  asyncHandler(auditoriasController.exportar)
);
auditoriasRouter.get("/:id", asyncHandler(auditoriasController.obtener));
auditoriasRouter.get("/:id/informe/pdf", asyncHandler(auditoriasController.informePdf));
auditoriasRouter.post(
  "/",
  requireRole("ADMIN", "AUDITOR"),
  validate(crearAuditoriaSchema),
  asyncHandler(auditoriasController.crear)
);
auditoriasRouter.put(
  "/:id",
  requireRole("ADMIN", "AUDITOR"),
  validate(actualizarAuditoriaSchema),
  asyncHandler(auditoriasController.actualizar)
);
auditoriasRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(auditoriasController.eliminar));

auditoriasRouter.post(
  "/:id/iniciar",
  requireRole("ADMIN", "AUDITOR"),
  asyncHandler(auditoriasController.iniciar)
);
auditoriasRouter.post(
  "/:id/cancelar",
  requireRole("ADMIN", "AUDITOR"),
  asyncHandler(auditoriasController.cancelar)
);

auditoriasRouter.post(
  "/:id/checklists",
  requireRole("ADMIN", "AUDITOR"),
  validate(crearChecklistSchema),
  asyncHandler(auditoriasController.agregarChecklist)
);
auditoriasRouter.put(
  "/checklists/preguntas/:preguntaId",
  requireRole("ADMIN", "AUDITOR"),
  validate(responderPreguntaSchema),
  asyncHandler(auditoriasController.responderPregunta)
);

auditoriasRouter.post(
  "/:id/hallazgos",
  requireRole("ADMIN", "AUDITOR"),
  validate(crearHallazgoSchema),
  asyncHandler(auditoriasController.agregarHallazgo)
);

auditoriasRouter.post(
  "/:id/informe",
  requireRole("ADMIN", "AUDITOR"),
  validate(crearInformeSchema),
  asyncHandler(auditoriasController.crearInforme)
);
