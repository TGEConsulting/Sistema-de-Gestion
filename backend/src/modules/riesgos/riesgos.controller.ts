import type { Request, Response } from "express";
import { enviarExcel } from "../../utils/excel";
import * as riesgosService from "./riesgos.service";

export async function listar(req: Request, res: Response) {
  res.json(await riesgosService.listarRiesgos(req.query as never));
}

export async function exportar(req: Request, res: Response) {
  const riesgos = await riesgosService.listarRiesgosParaExportar(req.query as never);
  await enviarExcel(
    res,
    "riesgos.xlsx",
    "Riesgos",
    [
      { encabezado: "Código", valor: (r) => r.codigo },
      { encabezado: "Descripción", valor: (r) => r.descripcion, ancho: 45 },
      { encabezado: "Proceso", valor: (r) => r.proceso.nombre },
      { encabezado: "Categoría", valor: (r) => r.categoria.nombre },
      { encabezado: "Probabilidad", valor: (r) => r.probabilidad },
      { encabezado: "Impacto", valor: (r) => r.impacto },
      { encabezado: "Puntaje", valor: (r) => r.puntajeRiesgo },
      { encabezado: "Nivel", valor: (r) => r.nivelRiesgo },
      { encabezado: "Responsable", valor: (r) => r.responsable.nombre },
      { encabezado: "Estado", valor: (r) => r.estado },
    ],
    riesgos
  );
}

export async function obtener(req: Request, res: Response) {
  res.json(await riesgosService.obtenerRiesgo(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await riesgosService.crearRiesgo(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await riesgosService.actualizarRiesgo(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await riesgosService.eliminarRiesgo(req.params.id);
  res.status(204).send();
}

export async function agregarTratamiento(req: Request, res: Response) {
  res.status(201).json(await riesgosService.agregarTratamiento(req.params.id, req.body));
}

export async function actualizarTratamiento(req: Request, res: Response) {
  res.json(await riesgosService.actualizarTratamiento(req.params.tratamientoId, req.body));
}
