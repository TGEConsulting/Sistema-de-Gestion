import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";
import {
  actualizarDocumentoSchema,
  crearDocumentoSchema,
  crearVersionSchema,
  evidenciaLecturaSchema,
  listarDocumentosQuerySchema,
} from "./documentos.validators";
import * as documentosController from "./documentos.controller";
import { tiposDocumentoRouter } from "./tipos-documento.routes";

export const documentosRouter = Router();

documentosRouter.use(authMiddleware);

documentosRouter.get(
  "/",
  validate(listarDocumentosQuerySchema, "query"),
  asyncHandler(documentosController.listar)
);
documentosRouter.get(
  "/export",
  validate(listarDocumentosQuerySchema, "query"),
  asyncHandler(documentosController.exportar)
);
documentosRouter.get("/:id", asyncHandler(documentosController.obtener));
documentosRouter.post(
  "/",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearDocumentoSchema),
  asyncHandler(documentosController.crear)
);
documentosRouter.put(
  "/:id",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(actualizarDocumentoSchema),
  asyncHandler(documentosController.actualizar)
);
documentosRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(documentosController.eliminar)
);

documentosRouter.post(
  "/:id/enviar-revision",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  asyncHandler(documentosController.enviarARevision)
);
documentosRouter.post(
  "/:id/aprobar",
  requireRole("ADMIN", "AUDITOR"),
  asyncHandler(documentosController.aprobar)
);
documentosRouter.post(
  "/:id/obsoleto",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  asyncHandler(documentosController.marcarObsoleto)
);
documentosRouter.post(
  "/:id/versiones",
  requireRole("ADMIN", "RESPONSABLE_PROCESO"),
  validate(crearVersionSchema),
  asyncHandler(documentosController.crearVersion)
);
documentosRouter.post(
  "/:id/evidencias-lectura",
  validate(evidenciaLecturaSchema),
  asyncHandler(documentosController.registrarEvidenciaLectura)
);

export { tiposDocumentoRouter };
