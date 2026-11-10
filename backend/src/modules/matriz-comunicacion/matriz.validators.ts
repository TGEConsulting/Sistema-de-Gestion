import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

const estadoEnum = z.enum(["PROPUESTA", "ACEPTADA", "CON_AJUSTE", "RECHAZADA"]);

export const crearInterfazSchema = z.object({
  documentoCodigo: z.string().min(3),
  documentoTitulo: z.string().optional(),
  areaDuenaId: z.string().min(1),
  areaContraparteId: z.string().optional(),
  contraparteTexto: z.string().min(2),
  entrega: z.string().optional(),
  recibe: z.string().optional(),
  plazo: z.string().optional(),
});

export const actualizarInterfazSchema = crearInterfazSchema.partial();

export const revisarInterfazSchema = z.object({
  estado: estadoEnum,
  observacion: z.string().optional(),
});

export const listarInterfacesQuerySchema = z
  .object({
    areaId: z.string().optional(), // dueña O contraparte (vista "mis interfaces")
    areaDuenaId: z.string().optional(),
    areaContraparteId: z.string().optional(),
    documentoCodigo: z.string().optional(),
    estado: estadoEnum.optional(),
    q: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export type CrearInterfazInput = z.infer<typeof crearInterfazSchema>;
export type ActualizarInterfazInput = z.infer<typeof actualizarInterfazSchema>;
export type RevisarInterfazInput = z.infer<typeof revisarInterfazSchema>;
export type ListarInterfacesQuery = z.infer<typeof listarInterfacesQuerySchema>;
