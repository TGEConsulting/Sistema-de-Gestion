import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

const tipoEnum = z.enum(["LEGAL", "ESQUEMA", "CLIENTE", "OTRO"]);
const estadoEnum = z.enum(["POR_EVALUAR", "CUMPLE", "PARCIAL", "NO_CUMPLE", "NO_APLICA"]);

export const crearRequisitoSchema = z.object({
  tipo: tipoEnum,
  sistema: z.string().optional(),
  requisito: z.string().min(3),
  fuente: z.string().optional(),
  apartado: z.string().optional(),
  comoSeCumple: z.string().optional(),
  documentos: z.string().optional(),
  areaId: z.string().optional(),
  responsableId: z.string().optional(),
  fechaVigor: z.coerce.date().optional(),
  vigenciaConfirmada: z.string().optional(),
  proximaEvaluacion: z.coerce.date().optional(),
});

export const actualizarRequisitoSchema = crearRequisitoSchema.partial();

export const evaluarRequisitoSchema = z.object({
  estado: estadoEnum,
  evidencia: z.string().optional(),
  proximaEvaluacion: z.coerce.date().optional(),
});

export const listarRequisitosQuerySchema = z
  .object({
    tipo: tipoEnum.optional(),
    estado: estadoEnum.optional(),
    sistema: z.string().optional(),
    areaId: z.string().optional(),
    responsableId: z.string().optional(),
    q: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export type CrearRequisitoInput = z.infer<typeof crearRequisitoSchema>;
export type ActualizarRequisitoInput = z.infer<typeof actualizarRequisitoSchema>;
export type EvaluarRequisitoInput = z.infer<typeof evaluarRequisitoSchema>;
export type ListarRequisitosQuery = z.infer<typeof listarRequisitosQuerySchema>;
