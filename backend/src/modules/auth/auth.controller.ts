import type { Request, Response } from "express";
import * as authService from "@/modules/auth/auth.service";
import { AppError } from "@/utils/AppError";

export async function loginController(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function loginGoogleController(req: Request, res: Response) {
  const result = await authService.loginConGoogle(req.body.credential);
  res.json(result);
}

export async function meController(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  const perfil = await authService.obtenerPerfil(req.auth.sub);
  res.json(perfil);
}

export async function logoutAllController(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  await authService.cerrarSesionesActivas(req.auth.sub);
  res.status(204).send();
}
