import { z } from "zod";
import { paginationQuerySchema } from "@/utils/pagination";

export const crearNCSchema = z.object({
  codigo: z.string().min(2),
  origen: z.enum(["AUDITORIA", "RECLAMO", "INCIDENTE", "INSPECCION", "AUTOEVALUACION"]),
  descripcion: z.string().min(3),
  procesoId: z.string().optional(),
  responsableId: z.string().min(1),
  fechaDeteccion: z.coerce.date().optional(),
  fechaCompromiso: z.coerce.date().optional(),
});

export const actualizarNCSchema = z.object({
  descripcion: z.string().min(3).optional(),
  causaRaiz: z.string().optional(),
  procesoId: z.string().optional(),
  responsableId: z.string().min(1).optional(),
  fechaCompromiso: z.coerce.date().optional(),
  estado: z
    .enum(["ABIERTA", "EN_ANALISIS", "ACCION_DEFINIDA", "EN_IMPLEMENTACION", "CERRADA", "INEFICAZ"])
    .optional(),
  evidenciaCierre: z.string().optional(),
});

export const listarNCQuerySchema = z
  .object({
    estado: z.string().optional(),
    origen: z.string().optional(),
    procesoId: z.string().optional(),
    responsableId: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export const crearAccionSchema = z.object({
  descripcion: z.string().min(3),
  tipo: z.enum(["INMEDIATA", "CORRECTIVA", "PREVENTIVA"]),
  responsableId: z.string().min(1),
  fechaCompromiso: z.coerce.date(),
  evidenciaUrl: z.string().optional(),
});

export const actualizarAccionSchema = z.object({
  descripcion: z.string().min(3).optional(),
  tipo: z.enum(["INMEDIATA", "CORRECTIVA", "PREVENTIVA"]).optional(),
  responsableId: z.string().min(1).optional(),
  fechaCompromiso: z.coerce.date().optional(),
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "COMPLETADA", "VENCIDA"]).optional(),
  evidenciaUrl: z.string().optional(),
});

export type CrearNCInput = z.infer<typeof crearNCSchema>;
export type ActualizarNCInput = z.infer<typeof actualizarNCSchema>;
export type ListarNCQuery = z.infer<typeof listarNCQuerySchema>;
export type CrearAccionInput = z.infer<typeof crearAccionSchema>;
export type ActualizarAccionInput = z.infer<typeof actualizarAccionSchema>;
