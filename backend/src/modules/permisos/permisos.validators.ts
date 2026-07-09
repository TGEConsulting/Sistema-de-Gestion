import { z } from "zod";

const MODULOS = [
  "DOCUMENTOS",
  "OBJETIVOS",
  "RIESGOS",
  "NO_CONFORMIDADES",
  "AUDITORIAS",
  "INDICADORES",
  "PERSONAS",
  "PROVEEDORES",
  "COMUNICACIONES",
] as const;

const NIVELES = ["NINGUNO", "VER", "EDITAR", "APROBAR"] as const;

export const actualizarMatrizSchema = z.object({
  permisos: z
    .array(
      z.object({
        rolId: z.string().min(1),
        modulo: z.enum(MODULOS),
        nivel: z.enum(NIVELES),
      })
    )
    .min(1),
});
