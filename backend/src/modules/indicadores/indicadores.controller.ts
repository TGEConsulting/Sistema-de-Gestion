import type { Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { enviarExcel } from "@/utils/excel";
import * as indicadoresService from "@/modules/indicadores/indicadores.service";

export async function listar(req: Request, res: Response) {
  res.json(await indicadoresService.listarIndicadores(req.query as never));
}

export async function exportar(req: Request, res: Response) {
  const registros = await indicadoresService.listarRegistrosParaExportar(req.query as never);
  await enviarExcel(
    res,
    "indicadores.xlsx",
    "Registros de indicadores",
    [
      { encabezado: "Indicador", valor: (r) => r.indicador, ancho: 35 },
      { encabezado: "Responsable", valor: (r) => r.responsable },
      { encabezado: "Fecha", valor: (r) => r.fecha },
      { encabezado: "Valor", valor: (r) => r.valor },
      { encabezado: "Meta", valor: (r) => r.meta },
      { encabezado: "Unidad", valor: (r) => r.unidad },
      { encabezado: "Semáforo", valor: (r) => r.semaforo },
      { encabezado: "Observaciones", valor: (r) => r.observaciones, ancho: 35 },
    ],
    registros
  );
}

export async function obtener(req: Request, res: Response) {
  res.json(await indicadoresService.obtenerIndicador(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await indicadoresService.crearIndicador(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await indicadoresService.actualizarIndicador(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await indicadoresService.eliminarIndicador(req.params.id);
  res.status(204).send();
}

export async function registrarValor(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  res.status(201).json(await indicadoresService.registrarValor(req.params.id, req.body, req.auth.sub));
}
