import { z } from "zod";

export const nombreRolSchema = z.enum(["ADMIN", "AUDITOR", "RESPONSABLE_PROCESO", "LECTURA"]);

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: nombreRolSchema,
  personaId: z.string().optional(),
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(2).optional(),
  rol: nombreRolSchema.optional(),
  personaId: z.string().optional(),
  activo: z.boolean().optional(),
});

export const cambiarPasswordSchema = z.object({
  password: z.string().min(8),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
