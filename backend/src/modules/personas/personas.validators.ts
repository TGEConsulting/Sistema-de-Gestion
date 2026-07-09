import { z } from "zod";
import { paginationQuerySchema } from "@/utils/pagination";

export const crearPersonaSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  puestoId: z.string().optional(),
  areaId: z.string().optional(),
});

export const actualizarPersonaSchema = crearPersonaSchema.partial().extend({
  activo: z.boolean().optional(),
});

export const listarPersonasQuerySchema = z
  .object({
    areaId: z.string().optional(),
    puestoId: z.string().optional(),
    activo: z.coerce.boolean().optional(),
    q: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export type CrearPersonaInput = z.infer<typeof crearPersonaSchema>;
export type ActualizarPersonaInput = z.infer<typeof actualizarPersonaSchema>;
export type ListarPersonasQuery = z.infer<typeof listarPersonasQuerySchema>;
