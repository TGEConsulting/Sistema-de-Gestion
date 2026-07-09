import { z } from "zod";
import { paginationQuerySchema } from "@/utils/pagination";

export const crearIndicadorSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  formula: z.string().optional(),
  frecuencia: z.enum(["DIARIA", "SEMANAL", "MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]),
  meta: z.number(),
  unidad: z.string().optional(),
  direccion: z.enum(["MAYOR_ES_MEJOR", "MENOR_ES_MEJOR"]).default("MAYOR_ES_MEJOR"),
  procesoId: z.string().optional(),
  responsableId: z.string().min(1),
});

export const actualizarIndicadorSchema = crearIndicadorSchema.partial().extend({
  activo: z.boolean().optional(),
});

export const listarIndicadoresQuerySchema = z
  .object({
    procesoId: z.string().optional(),
    responsableId: z.string().optional(),
    activo: z.coerce.boolean().optional(),
  })
  .merge(paginationQuerySchema);

export const crearRegistroSchema = z.object({
  valor: z.number(),
  fecha: z.coerce.date(),
  observaciones: z.string().optional(),
});

export type CrearIndicadorInput = z.infer<typeof crearIndicadorSchema>;
export type ActualizarIndicadorInput = z.infer<typeof actualizarIndicadorSchema>;
export type ListarIndicadoresQuery = z.infer<typeof listarIndicadoresQuerySchema>;
export type CrearRegistroInput = z.infer<typeof crearRegistroSchema>;
