import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
import {
  actualizarAuditoriaSchema,
  crearAuditoriaSchema,
  crearChecklistSchema,
  crearHallazgoSchema,
  crearInformeSchema,
  listarAuditoriasQuerySchema,
  responderPreguntaSchema,
} from "./auditorias.validators";
import * as auditoriasController from "./auditorias.controller";

export const auditoriasRouter = Router();

auditoriasRouter.use(authMiddleware);

auditoriasRouter.get(
  "/",
  requirePermiso("AUDITORIAS", "VER"),
  validate(listarAuditoriasQuerySchema, "query"),
  asyncHandler(auditoriasController.listar)
);
auditoriasRouter.get(
  "/export",
  requirePermiso("AUDITORIAS", "VER"),
  validate(listarAuditoriasQuerySchema, "query"),
  asyncHandler(auditoriasController.exportar)
);
auditoriasRouter.get("/:id", requirePermiso("AUDITORIAS", "VER"), asyncHandler(auditoriasController.obtener));
auditoriasRouter.get(
  "/:id/informe/pdf",
  requirePermiso("AUDITORIAS", "VER"),
  asyncHandler(auditoriasController.informePdf)
);
auditoriasRouter.post(
  "/",
  requirePermiso("AUDITORIAS", "EDITAR"),
  validate(crearAuditoriaSchema),
  asyncHandler(auditoriasController.crear)
);
auditoriasRouter.put(
  "/:id",
  requirePermiso("AUDITORIAS", "EDITAR"),
  validate(actualizarAuditoriaSchema),
  asyncHandler(auditoriasController.actualizar)
);
auditoriasRouter.delete("/:id", requirePermiso("AUDITORIAS", "APROBAR"), asyncHandler(auditoriasController.eliminar));

auditoriasRouter.post(
  "/:id/iniciar",
  requirePermiso("AUDITORIAS", "EDITAR"),
  asyncHandler(auditoriasController.iniciar)
);
auditoriasRouter.post(
  "/:id/cancelar",
  requirePermiso("AUDITORIAS", "EDITAR"),
  asyncHandler(auditoriasController.cancelar)
);

auditoriasRouter.post(
  "/:id/checklists",
  requirePermiso("AUDITORIAS", "EDITAR"),
  validate(crearChecklistSchema),
  asyncHandler(auditoriasController.agregarChecklist)
);
auditoriasRouter.put(
  "/checklists/preguntas/:preguntaId",
  requirePermiso("AUDITORIAS", "EDITAR"),
  validate(responderPreguntaSchema),
  asyncHandler(auditoriasController.responderPregunta)
);

auditoriasRouter.post(
  "/:id/hallazgos",
  requirePermiso("AUDITORIAS", "EDITAR"),
  validate(crearHallazgoSchema),
  asyncHandler(auditoriasController.agregarHallazgo)
);

auditoriasRouter.post(
  "/:id/informe",
  requirePermiso("AUDITORIAS", "APROBAR"),
  validate(crearInformeSchema),
  asyncHandler(auditoriasController.crearInforme)
);
