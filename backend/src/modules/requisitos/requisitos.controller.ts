import type { Request, Response } from "express";
import { enviarExcel } from "../../utils/excel";
import * as requisitosService from "./requisitos.service";

const TIPO_LABEL: Record<string, string> = { LEGAL: "Legal", ESQUEMA: "Esquema", CLIENTE: "Cliente", OTRO: "Otro" };
const ESTADO_LABEL: Record<string, string> = {
  POR_EVALUAR: "Por evaluar",
  CUMPLE: "Cumple",
  PARCIAL: "Parcial",
  NO_CUMPLE: "No cumple",
  NO_APLICA: "No aplica",
};

export async function listar(req: Request, res: Response) {
  res.json(await requisitosService.listarRequisitos(req.query as never));
}

export async function resumen(_req: Request, res: Response) {
  res.json(await requisitosService.resumenRequisitos());
}

export async function exportar(req: Request, res: Response) {
  const filas = await requisitosService.listarRequisitosParaExportar(req.query as never);
  await enviarExcel(
    res,
    "PR-IMS-02-F01 Matriz de requisitos.xlsx",
    "Requisitos",
    [
      { encabezado: "Tipo", valor: (r) => TIPO_LABEL[r.tipo] ?? r.tipo, ancho: 10 },
      { encabezado: "Sistema", valor: (r) => r.sistema, ancho: 14 },
      { encabezado: "Requisito", valor: (r) => r.requisito, ancho: 60 },
      { encabezado: "Fuente", valor: (r) => r.fuente, ancho: 30 },
      { encabezado: "Apartado", valor: (r) => r.apartado, ancho: 24 },
      { encabezado: "Cómo se cumple", valor: (r) => r.comoSeCumple, ancho: 45 },
      { encabezado: "Documentos del sistema", valor: (r) => r.documentos, ancho: 30 },
      { encabezado: "Área", valor: (r) => r.area?.nombre ?? "", ancho: 24 },
      { encabezado: "Responsable", valor: (r) => r.responsable?.nombre ?? "", ancho: 24 },
      { encabezado: "En vigor desde", valor: (r) => r.fechaVigor },
      { encabezado: "Vigencia confirmada", valor: (r) => r.vigenciaConfirmada, ancho: 50 },
      { encabezado: "Estado de cumplimiento", valor: (r) => ESTADO_LABEL[r.estado] ?? r.estado, ancho: 16 },
      { encabezado: "Evidencia", valor: (r) => r.evidencia, ancho: 30 },
      { encabezado: "Próxima evaluación", valor: (r) => r.proximaEvaluacion },
    ],
    filas
  );
}

export async function obtener(req: Request, res: Response) {
  res.json(await requisitosService.obtenerRequisito(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await requisitosService.crearRequisito(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await requisitosService.actualizarRequisito(req.params.id, req.body));
}

export async function evaluar(req: Request, res: Response) {
  res.json(await requisitosService.evaluarRequisito(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await requisitosService.eliminarRequisito(req.params.id);
  res.status(204).send();
}
