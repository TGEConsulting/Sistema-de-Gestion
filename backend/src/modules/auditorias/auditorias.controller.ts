import type { Request, Response } from "express";
import { enviarExcel } from "@/utils/excel";
import { enviarInformeAuditoriaPdf } from "@/utils/pdf";
import * as auditoriasService from "@/modules/auditorias/auditorias.service";

export async function listar(req: Request, res: Response) {
  res.json(await auditoriasService.listarAuditorias(req.query as never));
}

export async function exportar(req: Request, res: Response) {
  const auditorias = await auditoriasService.listarAuditoriasParaExportar(req.query as never);
  await enviarExcel(
    res,
    "auditorias.xlsx",
    "Auditorías",
    [
      { encabezado: "Tipo", valor: (a) => a.tipo },
      { encabezado: "Alcance", valor: (a) => a.alcance, ancho: 40 },
      { encabezado: "Programa", valor: (a) => a.programa?.nombre ?? "" },
      { encabezado: "Fecha inicio", valor: (a) => a.fechaInicio },
      { encabezado: "Fecha fin", valor: (a) => a.fechaFin },
      { encabezado: "Líder auditor", valor: (a) => a.liderAuditor.nombre },
      { encabezado: "Estado", valor: (a) => a.estado },
      { encabezado: "Hallazgos", valor: (a) => a.hallazgos.length },
    ],
    auditorias
  );
}

export async function informePdf(req: Request, res: Response) {
  const auditoria = await auditoriasService.obtenerAuditoria(req.params.id);
  enviarInformeAuditoriaPdf(res, auditoria);
}

export async function obtener(req: Request, res: Response) {
  res.json(await auditoriasService.obtenerAuditoria(req.params.id));
}

export async function crear(req: Request, res: Response) {
  res.status(201).json(await auditoriasService.crearAuditoria(req.body));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await auditoriasService.actualizarAuditoria(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await auditoriasService.eliminarAuditoria(req.params.id);
  res.status(204).send();
}

export async function iniciar(req: Request, res: Response) {
  res.json(await auditoriasService.iniciarAuditoria(req.params.id));
}

export async function cancelar(req: Request, res: Response) {
  res.json(await auditoriasService.cancelarAuditoria(req.params.id));
}

export async function agregarChecklist(req: Request, res: Response) {
  res.status(201).json(await auditoriasService.agregarChecklist(req.params.id, req.body));
}

export async function responderPregunta(req: Request, res: Response) {
  res.json(await auditoriasService.responderPregunta(req.params.preguntaId, req.body));
}

export async function agregarHallazgo(req: Request, res: Response) {
  res.status(201).json(await auditoriasService.agregarHallazgo(req.params.id, req.body));
}

export async function crearInforme(req: Request, res: Response) {
  res.status(201).json(await auditoriasService.crearInforme(req.params.id, req.body));
}
