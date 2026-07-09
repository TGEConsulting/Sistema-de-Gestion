import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import * as proveedoresService from "./proveedores.service";

export async function listar(req: Request, res: Response) {
  res.json(await proveedoresService.listarProveedores(req.query as never));
}

export async function obtener(req: Request, res: Response) {
  res.json(await proveedoresService.obtenerProveedor(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await proveedoresService.crearProveedor(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await proveedoresService.actualizarProveedor(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await proveedoresService.eliminarProveedor(req.params.id);
  res.status(204).send();
}

export async function agregarEvaluacion(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  res
    .status(201)
    .json(await proveedoresService.agregarEvaluacion(req.params.id, req.body, req.auth.sub));
}

export async function agregarDocumento(req: Request, res: Response) {
  res.status(201).json(await proveedoresService.agregarDocumento(req.params.id, req.body));
}
