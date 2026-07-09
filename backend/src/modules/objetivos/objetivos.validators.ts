import { z } from "zod";

export const crearObjetivoSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  tipo: z.enum(["ESTRATEGICO", "OPERATIVO"]).default("OPERATIVO"),
  areaId: z.string().min(1),
  responsableId: z.string().min(1),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
});

export const actualizarObjetivoSchema = crearObjetivoSchema.partial().extend({
  estado: z.enum(["PLANEADO", "EN_PROCESO", "LOGRADO", "NO_LOGRADO", "CANCELADO"]).optional(),
});

export const listarObjetivosQuerySchema = z.object({
  areaId: z.string().optional(),
  estado: z.string().optional(),
  tipo: z.string().optional(),
});

export type CrearObjetivoInput = z.infer<typeof crearObjetivoSchema>;
export type ActualizarObjetivoInput = z.infer<typeof actualizarObjetivoSchema>;
