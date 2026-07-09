import type { NextFunction, Request, Response } from "express";
import type { ModuloSistema, NivelPermiso, NombreRol } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { cumpleNivel, obtenerNivel } from "../lib/permisos";
import { asyncHandler } from "../utils/asyncHandler";

// Uso: router.post("/", authMiddleware, requireRole("ADMIN"), controller.crear)
export function requireRole(...rolesPermitidos: NombreRol[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    if (!rolesPermitidos.includes(req.auth.rol)) {
      throw AppError.forbidden(
        `Esta acción requiere alguno de estos roles: ${rolesPermitidos.join(", ")}`
      );
    }
    next();
  };
}

// Uso: router.get("/", authMiddleware, requirePermiso("DOCUMENTOS", "VER"), controller.listar)
// El nivel de cada rol se administra desde la matriz de permisos (módulo Permisos, solo ADMIN).
// ADMIN siempre resuelve a APROBAR sin consultar la tabla, para que la matriz nunca pueda
// bloquear al propio administrador.
export function requirePermiso(modulo: ModuloSistema, nivelMinimo: NivelPermiso) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const nivelActual = await obtenerNivel(req.auth.rol, modulo);
    if (!cumpleNivel(nivelActual, nivelMinimo)) {
      throw AppError.forbidden(
        `Tu rol no tiene permiso de "${nivelMinimo}" en el módulo ${modulo}`
      );
    }
    next();
  });
}
