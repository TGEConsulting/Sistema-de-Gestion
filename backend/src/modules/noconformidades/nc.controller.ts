import type { Request, Response } from "express";
import { enviarExcel } from "@/utils/excel";
import * as ncService from "@/modules/noconformidades/nc.service";

export async function listar(req: Request, res: Response) {
  res.json(await ncService.listarNC(req.query as never));
}

export async function exportar(req: Request, res: Response) {
  const ncs = await ncService.listarNCParaExportar(req.query as never);
  await enviarExcel(
    res,
    "no-conformidades.xlsx",
    "No Conformidades",
    [
      { encabezado: "Código", valor: (n) => n.codigo },
      { encabezado: "Origen", valor: (n) => n.origen },
      { encabezado: "Descripción", valor: (n) => n.descripcion, ancho: 45 },
      { encabezado: "Proceso", valor: (n) => n.proceso?.nombre ?? "" },
      { encabezado: "Responsable", valor: (n) => n.responsable.nombre },
      { encabezado: "Fecha detección", valor: (n) => n.fechaDeteccion },
      { encabezado: "Estado", valor: (n) => n.estado },
    ],
    ncs
  );
}

export async function obtener(req: Request, res: Response) {
  res.json(await ncService.obtenerNC(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await ncService.crearNC(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await ncService.actualizarNC(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await ncService.eliminarNC(req.params.id);
  res.status(204).send();
}

export async function cerrar(req: Request, res: Response) {
  res.json(await ncService.cerrarNC(req.params.id, req.body.evidenciaCierre));
}

export async function agregarAccion(req: Request, res: Response) {
  res.status(201).json(await ncService.agregarAccion(req.params.id, req.body));
}

export async function actualizarAccion(req: Request, res: Response) {
  res.json(await ncService.actualizarAccion(req.params.accionId, req.body));
}
