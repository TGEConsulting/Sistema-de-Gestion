import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermiso } from "../../middleware/rbac.middleware";
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
  requirePermiso("DOCUMENTOS", "VER"),
  validate(listarDocumentosQuerySchema, "query"),
  asyncHandler(documentosController.listar)
);
documentosRouter.get(
  "/export",
  requirePermiso("DOCUMENTOS", "VER"),
  validate(listarDocumentosQuerySchema, "query"),
  asyncHandler(documentosController.exportar)
);
documentosRouter.get("/:id", requirePermiso("DOCUMENTOS", "VER"), asyncHandler(documentosController.obtener));
documentosRouter.post(
  "/",
  requirePermiso("DOCUMENTOS", "EDITAR"),
  validate(crearDocumentoSchema),
  asyncHandler(documentosController.crear)
);
documentosRouter.put(
  "/:id",
  requirePermiso("DOCUMENTOS", "EDITAR"),
  validate(actualizarDocumentoSchema),
  asyncHandler(documentosController.actualizar)
);
documentosRouter.delete(
  "/:id",
  requirePermiso("DOCUMENTOS", "APROBAR"),
  asyncHandler(documentosController.eliminar)
);

documentosRouter.post(
  "/:id/enviar-revision",
  requirePermiso("DOCUMENTOS", "EDITAR"),
  asyncHandler(documentosController.enviarARevision)
);
documentosRouter.post(
  "/:id/aprobar",
  requirePermiso("DOCUMENTOS", "APROBAR"),
  asyncHandler(documentosController.aprobar)
);
documentosRouter.post(
  "/:id/obsoleto",
  requirePermiso("DOCUMENTOS", "EDITAR"),
  asyncHandler(documentosController.marcarObsoleto)
);
documentosRouter.post(
  "/:id/versiones",
  requirePermiso("DOCUMENTOS", "EDITAR"),
  validate(crearVersionSchema),
  asyncHandler(documentosController.crearVersion)
);
documentosRouter.post(
  "/:id/evidencias-lectura",
  requirePermiso("DOCUMENTOS", "VER"),
  validate(evidenciaLecturaSchema),
  asyncHandler(documentosController.registrarEvidenciaLectura)
);

export { tiposDocumentoRouter };
