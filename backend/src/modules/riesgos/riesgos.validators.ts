import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

const probabilidadImpacto = z.number().int().min(1).max(5);

export const crearRiesgoSchema = z.object({
  codigo: z.string().min(2),
  descripcion: z.string().min(3),
  procesoId: z.string().min(1),
  categoriaId: z.string().min(1),
  probabilidad: probabilidadImpacto,
  impacto: probabilidadImpacto,
  controlesExistentes: z.string().optional(),
  responsableId: z.string().min(1),
});

export const actualizarRiesgoSchema = z.object({
  descripcion: z.string().min(3).optional(),
  procesoId: z.string().min(1).optional(),
  categoriaId: z.string().min(1).optional(),
  probabilidad: probabilidadImpacto.optional(),
  impacto: probabilidadImpacto.optional(),
  controlesExistentes: z.string().optional(),
  responsableId: z.string().min(1).optional(),
  estado: z.enum(["IDENTIFICADO", "EN_TRATAMIENTO", "MITIGADO", "CERRADO"]).optional(),
});

export const listarRiesgosQuerySchema = z
  .object({
    procesoId: z.string().optional(),
    categoriaId: z.string().optional(),
    nivelRiesgo: z.enum(["BAJO", "MODERADO", "ALTO", "CRITICO"]).optional(),
    estado: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export const crearTratamientoSchema = z.object({
  descripcion: z.string().min(3),
  responsableId: z.string().min(1),
  fechaCompromiso: z.coerce.date(),
});

export const actualizarTratamientoSchema = z.object({
  descripcion: z.string().min(3).optional(),
  responsableId: z.string().min(1).optional(),
  fechaCompromiso: z.coerce.date().optional(),
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "IMPLEMENTADO", "VERIFICADO"]).optional(),
  evidenciaUrl: z.string().optional(),
});

export type CrearRiesgoInput = z.infer<typeof crearRiesgoSchema>;
export type ActualizarRiesgoInput = z.infer<typeof actualizarRiesgoSchema>;
export type ListarRiesgosQuery = z.infer<typeof listarRiesgosQuerySchema>;
export type CrearTratamientoInput = z.infer<typeof crearTratamientoSchema>;
export type ActualizarTratamientoInput = z.infer<typeof actualizarTratamientoSchema>;
