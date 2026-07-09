import { z } from "zod";

export const crearPuestoSchema = z.object({
  nombre: z.string().min(2),
  areaId: z.string().min(1),
});

export const actualizarPuestoSchema = crearPuestoSchema.partial().extend({
  activo: z.boolean().optional(),
});

export const listarPuestosQuerySchema = z.object({
  areaId: z.string().optional(),
  activo: z.coerce.boolean().optional(),
});

export type CrearPuestoInput = z.infer<typeof crearPuestoSchema>;
export type ActualizarPuestoInput = z.infer<typeof actualizarPuestoSchema>;
