import type { Request, Response } from "express";
import * as permisosService from "./permisos.service";

export async function obtener(_req: Request, res: Response) {
  res.json(await permisosService.obtenerMatriz());
}

export async function actualizar(req: Request, res: Response) {
  const { permisos } = req.body;
  res.json(await permisosService.actualizarMatriz(permisos));
}
