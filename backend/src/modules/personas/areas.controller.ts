import type { Request, Response } from "express";
import * as areasService from "./areas.service";

export async function listar(req: Request, res: Response) {
  const areas = await areasService.listarAreas(req.query as { activo?: boolean; q?: string });
  res.json(areas);
}

export async function obtener(req: Request, res: Response) {
  const area = await areasService.obtenerArea(req.params.id);
  res.json(area);
}

export async function crear(req: Request, res: Response) {
  const area = await areasService.crearArea(req.body);
  res.status(201).json(area);
}

export async function actualizar(req: Request, res: Response) {
  const area = await areasService.actualizarArea(req.params.id, req.body);
  res.json(area);
}

export async function eliminar(req: Request, res: Response) {
  await areasService.eliminarArea(req.params.id);
  res.status(204).send();
}
