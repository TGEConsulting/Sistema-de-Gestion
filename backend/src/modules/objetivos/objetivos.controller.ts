import type { Request, Response } from "express";
import * as objetivosService from "@/modules/objetivos/objetivos.service";

export async function listar(req: Request, res: Response) {
  res.json(await objetivosService.listarObjetivos(req.query as never));
}

export async function obtener(req: Request, res: Response) {
  res.json(await objetivosService.obtenerObjetivo(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await objetivosService.crearObjetivo(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await objetivosService.actualizarObjetivo(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await objetivosService.eliminarObjetivo(req.params.id);
  res.status(204).send();
}
