import { z } from "zod";

export const crearAreaSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
});

export const actualizarAreaSchema = crearAreaSchema.partial().extend({
  activo: z.boolean().optional(),
});

export const listarAreasQuerySchema = z.object({
  activo: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

export type CrearAreaInput = z.infer<typeof crearAreaSchema>;
export type ActualizarAreaInput = z.infer<typeof actualizarAreaSchema>;
