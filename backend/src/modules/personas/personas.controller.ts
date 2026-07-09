import type { Request, Response } from "express";
import * as personasService from "./personas.service";

export async function listar(req: Request, res: Response) {
  res.json(await personasService.listarPersonas(req.query as never));
}

export async function obtener(req: Request, res: Response) {
  res.json(await personasService.obtenerPersona(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await personasService.crearPersona(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await personasService.actualizarPersona(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await personasService.eliminarPersona(req.params.id);
  res.status(204).send();
}
