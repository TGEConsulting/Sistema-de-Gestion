import type { Request, Response } from "express";
import { enviarExcel } from "../../utils/excel";
import * as service from "./matriz.service";

const ESTADO_LABEL: Record<string, string> = { PROPUESTA: "Propuesta", ACEPTADA: "Aceptada", CON_AJUSTE: "Con ajuste", RECHAZADA: "Rechazada" };

export async function listar(req: Request, res: Response) {
  res.json(await service.listarInterfaces(req.query as never));
}
export async function resumen(_req: Request, res: Response) {
  res.json(await service.resumenPorArea());
}
export async function exportar(req: Request, res: Response) {
  const filas = await service.listarParaExportar(req.query as never);
  await enviarExcel(
    res,
    "PR-IMS-04-F02 Matriz de comunicacion.xlsx",
    "Matriz de comunicación",
    [
      { encabezado: "Procedimiento", valor: (f) => f.documentoCodigo, ancho: 14 },
      { encabezado: "Título", valor: (f) => f.documentoTitulo, ancho: 36 },
      { encabezado: "Gerencia dueña", valor: (f) => f.areaDuena.nombre, ancho: 30 },
      { encabezado: "Contraparte", valor: (f) => f.areaContraparte?.nombre ?? f.contraparteTexto, ancho: 30 },
      { encabezado: "La contraparte entrega", valor: (f) => f.entrega, ancho: 45 },
      { encabezado: "La contraparte recibe", valor: (f) => f.recibe, ancho: 45 },
      { encabezado: "Plazo", valor: (f) => f.plazo, ancho: 18 },
      { encabezado: "Estado", valor: (f) => ESTADO_LABEL[f.estado] ?? f.estado, ancho: 12 },
      { encabezado: "Observación", valor: (f) => f.observacion, ancho: 40 },
    ],
    filas
  );
}
export async function obtener(req: Request, res: Response) {
  res.json(await service.obtenerInterfaz(req.params.id));
}
export async function crear(req: Request, res: Response) {
  res.status(201).json(await service.crearInterfaz(req.body));
}
export async function actualizar(req: Request, res: Response) {
  res.json(await service.actualizarInterfaz(req.params.id, req.body));
}
export async function revisar(req: Request, res: Response) {
  res.json(await service.revisarInterfaz(req.params.id, req.body));
}
export async function eliminar(req: Request, res: Response) {
  await service.eliminarInterfaz(req.params.id);
  res.status(204).send();
}
