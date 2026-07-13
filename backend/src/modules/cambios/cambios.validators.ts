import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

const categoriaCambioSchema = z.enum([
  "MATERIA_PRIMA_PROCESO_EQUIPO",
  "ETIQUETADO_DECLARACION",
  "PPR_CONTROL_OPERACIONAL",
  "REQUISITO_ESQUEMA_BOS",
  "ALCANCE_CERTIFICACION",
]);

export const crearCambioSchema = z.object({
  titulo: z.string().min(3),
  categoria: categoriaCambioSchema,
  descripcion: z.string().min(3),
  impactoInocuidad: z.string().min(10, "Describí el impacto en inocuidad o cumplimiento (mínimo 10 caracteres)"),
  impactoAlcance: z.boolean().optional(),
  procesoId: z.string().optional(),
  documentosRelacionados: z.string().optional(),
  fechaEfectiva: z.coerce.date().optional(),
  plazoTransicion: z.coerce.date().optional(),
});

export const actualizarCambioSchema = crearCambioSchema.partial();

export const listarCambiosQuerySchema = z
  .object({
    categoria: categoriaCambioSchema.optional(),
    estado: z.enum(["BORRADOR", "COMUNICADO", "IMPLEMENTADO", "CANCELADO"]).optional(),
    procesoId: z.string().optional(),
    q: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export const implementarCambioSchema = z.object({
  evidenciaImplementacion: z.string().optional(),
});

export type CrearCambioInput = z.infer<typeof crearCambioSchema>;
export type ActualizarCambioInput = z.infer<typeof actualizarCambioSchema>;
export type ListarCambiosQuery = z.infer<typeof listarCambiosQuerySchema>;
export type ImplementarCambioInput = z.infer<typeof implementarCambioSchema>;
