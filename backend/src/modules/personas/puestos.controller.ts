import type { Request, Response } from "express";
import * as puestosService from "@/modules/personas/puestos.service";

export async function listar(req: Request, res: Response) {
  const puestos = await puestosService.listarPuestos(
    req.query as { areaId?: string; activo?: boolean }
  );
  res.json(puestos);
}

export async function obtener(req: Request, res: Response) {
  res.json(await puestosService.obtenerPuesto(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await puestosService.crearPuesto(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await puestosService.actualizarPuesto(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await puestosService.eliminarPuesto(req.params.id);
  res.status(204).send();
}
