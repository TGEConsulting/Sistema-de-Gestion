import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import type { NombreRol } from "@prisma/client";

export interface AuthPayload {
  sub: string; // usuarioId
  email: string;
  rol: NombreRol;
  tokenVersion: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export const authMiddleware = asyncHandler(async (req: Request, _res: Response, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Falta el token de autenticación");
  }

  const token = header.slice("Bearer ".length);
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
  } catch {
    throw AppError.unauthorized("Token inválido o expirado");
  }

  // Se valida contra la BD (no solo la firma) para que desactivar un usuario,
  // cambiar su contraseña o cerrar sesión en todos los dispositivos invalide
  // de inmediato cualquier token ya emitido, en vez de esperar su expiración.
  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { activo: true, deletedAt: true, tokenVersion: true },
  });

  if (!usuario || usuario.deletedAt || !usuario.activo || usuario.tokenVersion !== payload.tokenVersion) {
    throw AppError.unauthorized("Token inválido o expirado");
  }

  req.auth = payload;
  next();
});
