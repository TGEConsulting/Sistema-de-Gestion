import type { Request, Response } from "express";
import * as usuariosService from "./usuarios.service";

export async function listar(_req: Request, res: Response) {
  res.json(await usuariosService.listarUsuarios());
}

export async function obtener(req: Request, res: Response) {
  res.json(await usuariosService.obtenerUsuario(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await usuariosService.crearUsuario(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await usuariosService.actualizarUsuario(req.params.id, req.body));
}

export async function cambiarPassword(req: Request, res: Response) {
  await usuariosService.cambiarPassword(req.params.id, req.body.password);
  res.status(204).send();
}

export async function eliminar(req: Request, res: Response) {
  await usuariosService.eliminarUsuario(req.params.id);
  res.status(204).send();
}
