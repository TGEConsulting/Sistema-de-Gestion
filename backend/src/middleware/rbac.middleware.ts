import type { NextFunction, Request, Response } from "express";
import type { NombreRol } from "@prisma/client";
import { AppError } from "@/utils/AppError";

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
