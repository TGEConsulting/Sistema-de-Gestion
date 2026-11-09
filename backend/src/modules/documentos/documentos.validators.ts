import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const crearDocumentoSchema = z.object({
  codigo: z.string().min(2),
  titulo: z.string().min(2),
  tipoDocumentoId: z.string().min(1),
  areaId: z.string().min(1),
  responsableId: z.string().min(1),
  proximaRevision: z.coerce.date().optional(),
  documentoPadreId: z.string().optional(),
  nivel: z.coerce.number().int().min(1).max(4).optional(),
  revision: z.string().optional(),
  clausulas: z.string().optional(),
  evidencias: z.string().optional(),
  participa: z.string().optional(),
  autoriza: z.string().optional(),
  carpeta: z.string().optional(),
  critico: z.coerce.boolean().optional(),
});

export const actualizarDocumentoSchema = z.object({
  titulo: z.string().min(2).optional(),
  tipoDocumentoId: z.string().min(1).optional(),
  areaId: z.string().min(1).optional(),
  responsableId: z.string().min(1).optional(),
  proximaRevision: z.coerce.date().optional(),
  documentoPadreId: z.string().optional(),
  nivel: z.coerce.number().int().min(1).max(4).optional(),
  revision: z.string().optional(),
  clausulas: z.string().optional(),
  evidencias: z.string().optional(),
  participa: z.string().optional(),
  autoriza: z.string().optional(),
  carpeta: z.string().optional(),
  critico: z.coerce.boolean().optional(),
});

export const listarDocumentosQuerySchema = z
  .object({
    tipoDocumentoId: z.string().optional(),
    areaId: z.string().optional(),
    estado: z.enum(["BORRADOR", "EN_REVISION", "APROBADO", "OBSOLETO"]).optional(),
    responsableId: z.string().optional(),
    documentoPadreId: z.string().optional(),
    nivel: z.coerce.number().int().optional(),
    q: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export const crearVersionSchema = z.object({
  cambios: z.string().optional(),
  archivoUrl: z.string().optional(),
});

export const evidenciaLecturaSchema = z.object({
  medio: z.string().optional(),
});

export type CrearDocumentoInput = z.infer<typeof crearDocumentoSchema>;
export type ActualizarDocumentoInput = z.infer<typeof actualizarDocumentoSchema>;
export type ListarDocumentosQuery = z.infer<typeof listarDocumentosQuerySchema>;
export type CrearVersionInput = z.infer<typeof crearVersionSchema>;
