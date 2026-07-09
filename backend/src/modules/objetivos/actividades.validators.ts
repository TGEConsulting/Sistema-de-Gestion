import { z } from "zod";

export const crearActividadSchema = z.object({
  planId: z.string().min(1),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  responsableId: z.string().min(1),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
});

export const actualizarActividadSchema = z.object({
  nombre: z.string().min(2).optional(),
  descripcion: z.string().optional(),
  responsableId: z.string().min(1).optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().optional(),
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "COMPLETADA", "ATRASADA"]).optional(),
  avancePorcentaje: z.number().int().min(0).max(100).optional(),
  evidenciaUrl: z.string().optional(),
});

export type CrearActividadInput = z.infer<typeof crearActividadSchema>;
export type ActualizarActividadInput = z.infer<typeof actualizarActividadSchema>;
