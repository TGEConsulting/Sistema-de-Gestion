import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const crearAuditoriaSchema = z.object({
  programaId: z.string().optional(),
  tipo: z.enum(["INTERNA", "EXTERNA", "CERTIFICACION"]),
  alcance: z.string().min(3),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  liderAuditorId: z.string().min(1),
  equipoAuditor: z.string().optional(),
});

export const actualizarAuditoriaSchema = crearAuditoriaSchema.partial();

export const listarAuditoriasQuerySchema = z
  .object({
    estado: z.string().optional(),
    programaId: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export const crearChecklistSchema = z.object({
  nombre: z.string().min(2),
  preguntas: z.array(z.string().min(2)).optional(),
});

export const responderPreguntaSchema = z.object({
  respuesta: z.enum(["CUMPLE", "NO_CUMPLE", "NO_APLICA", "PENDIENTE"]),
  observaciones: z.string().optional(),
  evidenciaUrl: z.string().optional(),
});

export const crearHallazgoSchema = z.object({
  tipo: z.enum(["NO_CONFORMIDAD", "OBSERVACION", "OPORTUNIDAD_MEJORA", "FORTALEZA"]),
  descripcion: z.string().min(3),
  procesoId: z.string().optional(),
  responsableId: z.string().optional(),
});

export const crearInformeSchema = z.object({
  resumen: z.string().min(3),
  conclusiones: z.string().optional(),
  archivoUrl: z.string().optional(),
});

export type CrearAuditoriaInput = z.infer<typeof crearAuditoriaSchema>;
export type ActualizarAuditoriaInput = z.infer<typeof actualizarAuditoriaSchema>;
export type ListarAuditoriasQuery = z.infer<typeof listarAuditoriasQuerySchema>;
export type CrearChecklistInput = z.infer<typeof crearChecklistSchema>;
export type CrearHallazgoInput = z.infer<typeof crearHallazgoSchema>;
export type CrearInformeInput = z.infer<typeof crearInformeSchema>;
