import { z } from "zod";

export const crearPlanSchema = z.object({
  objetivoId: z.string().min(1),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  responsableId: z.string().min(1),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
});

export const actualizarPlanSchema = crearPlanSchema.partial().extend({
  estado: z.enum(["PLANEADO", "EN_PROCESO", "LOGRADO", "NO_LOGRADO", "CANCELADO"]).optional(),
});

export type CrearPlanInput = z.infer<typeof crearPlanSchema>;
export type ActualizarPlanInput = z.infer<typeof actualizarPlanSchema>;
