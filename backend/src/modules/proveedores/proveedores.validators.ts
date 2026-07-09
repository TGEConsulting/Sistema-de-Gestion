import { z } from "zod";
import { paginationQuerySchema } from "@/utils/pagination";

export const crearProveedorSchema = z.object({
  nombre: z.string().min(2),
  taxId: z.string().optional(),
  tipo: z.enum(["INSUMOS", "SERVICIOS", "TRANSPORTE", "MAQUINARIA", "OTRO"]),
  contacto: z.string().optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
});

export const actualizarProveedorSchema = crearProveedorSchema.partial().extend({
  estado: z.enum(["EN_EVALUACION", "ACTIVO", "SUSPENDIDO", "INACTIVO"]).optional(),
});

export const listarProveedoresQuerySchema = z
  .object({
    tipo: z.string().optional(),
    estado: z.string().optional(),
    q: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export const crearEvaluacionSchema = z.object({
  puntuacion: z.number().min(0).max(100),
  criterios: z.record(z.number()).optional(),
  resultado: z.string().optional(),
});

export const crearDocumentoProveedorSchema = z.object({
  nombre: z.string().min(2),
  archivoUrl: z.string().optional(),
  fechaVencimiento: z.coerce.date().optional(),
});

export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>;
export type ActualizarProveedorInput = z.infer<typeof actualizarProveedorSchema>;
export type ListarProveedoresQuery = z.infer<typeof listarProveedoresQuerySchema>;
export type CrearEvaluacionInput = z.infer<typeof crearEvaluacionSchema>;
export type CrearDocumentoProveedorInput = z.infer<typeof crearDocumentoProveedorSchema>;
