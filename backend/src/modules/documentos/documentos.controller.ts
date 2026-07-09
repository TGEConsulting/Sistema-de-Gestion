import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { enviarExcel } from "../../utils/excel";
import * as documentosService from "./documentos.service";

export async function listar(req: Request, res: Response) {
  res.json(await documentosService.listarDocumentos(req.query as never));
}

export async function exportar(req: Request, res: Response) {
  const documentos = await documentosService.listarDocumentosParaExportar(req.query as never);
  await enviarExcel(
    res,
    "documentos.xlsx",
    "Documentos",
    [
      { encabezado: "Código", valor: (d) => d.codigo },
      { encabezado: "Título", valor: (d) => d.titulo, ancho: 40 },
      { encabezado: "Tipo", valor: (d) => d.tipoDocumento.nombre },
      { encabezado: "Área", valor: (d) => d.area.nombre },
      { encabezado: "Responsable", valor: (d) => d.responsable.nombre },
      { encabezado: "Estado", valor: (d) => d.estado },
      { encabezado: "Próxima revisión", valor: (d) => d.proximaRevision },
    ],
    documentos
  );
}

export async function obtener(req: Request, res: Response) {
  res.json(await documentosService.obtenerDocumento(req.params.id));
}

export async function crear(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  res.status(201).json(await documentosService.crearDocumento(req.body, req.auth.sub));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await documentosService.actualizarDocumento(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await documentosService.eliminarDocumento(req.params.id);
  res.status(204).send();
}

export async function enviarARevision(req: Request, res: Response) {
  await documentosService.enviarARevision(req.params.id);
  res.json(await documentosService.obtenerDocumento(req.params.id));
}

export async function aprobar(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  await documentosService.aprobarDocumento(req.params.id, req.auth.sub);
  res.json(await documentosService.obtenerDocumento(req.params.id));
}

export async function marcarObsoleto(req: Request, res: Response) {
  await documentosService.marcarObsoleto(req.params.id);
  res.json(await documentosService.obtenerDocumento(req.params.id));
}

export async function crearVersion(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  await documentosService.crearNuevaVersion(req.params.id, req.body, req.auth.sub);
  res.status(201).json(await documentosService.obtenerDocumento(req.params.id));
}

export async function registrarEvidenciaLectura(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  const evidencia = await documentosService.registrarEvidenciaLectura(
    req.params.id,
    req.auth.sub,
    req.body.medio
  );
  res.status(201).json(evidencia);
}
