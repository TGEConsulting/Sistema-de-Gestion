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

// --- Lista Maestra y paquete por esquema -----------------------------------

export async function exportarListaMaestra(_req: Request, res: Response) {
  const filas = await documentosService.listaMaestra();
  await enviarExcel(
    res,
    "PR-IMS-01-F01 Lista Maestra.xlsx",
    "Lista Maestra",
    [
      { encabezado: "Código", valor: (d) => d.codigo, ancho: 16 },
      { encabezado: "Título del documento", valor: (d) => d.titulo, ancho: 50 },
      { encabezado: "Tipo", valor: (d) => d.tipo, ancho: 24 },
      { encabezado: "Nivel", valor: (d) => d.nivel, ancho: 7 },
      { encabezado: "Documento padre", valor: (d) => d.padre, ancho: 14 },
      { encabezado: "Área", valor: (d) => d.area, ancho: 30 },
      { encabezado: "Elabora (L)", valor: (d) => d.responsable, ancho: 28 },
      { encabezado: "Participa (P)", valor: (d) => d.participa, ancho: 30 },
      { encabezado: "Autoriza (A)", valor: (d) => d.autoriza, ancho: 28 },
      { encabezado: "Cláusulas de la Norma", valor: (d) => d.clausulas, ancho: 18 },
      { encabezado: "Evidencias Anexo B (n°)", valor: (d) => d.evidencias, ancho: 18 },
      { encabezado: "Crítico", valor: (d) => (d.critico ? "Sí" : "No"), ancho: 8 },
      { encabezado: "Carpeta destino", valor: (d) => d.carpeta, ancho: 32 },
      { encabezado: "Rev.", valor: (d) => d.revision, ancho: 6 },
      { encabezado: "Estado", valor: (d) => d.estado, ancho: 14 },
      { encabezado: "Fecha emisión", valor: (d) => d.fechaEmision },
      { encabezado: "Próxima revisión", valor: (d) => d.proximaRevision },
    ],
    filas
  );
}

export async function esquemas(_req: Request, res: Response) {
  res.json(await documentosService.listarEsquemas());
}

export async function paqueteEsquema(req: Request, res: Response) {
  const esquema = String(req.query.esquema ?? "");
  if (!esquema) throw AppError.badRequest("Indique el esquema");
  res.json(await documentosService.paquetePorEsquema(esquema));
}

export async function exportarPaqueteEsquema(req: Request, res: Response) {
  const esquema = String(req.query.esquema ?? "");
  if (!esquema) throw AppError.badRequest("Indique el esquema");
  const filas = await documentosService.paquetePorEsquema(esquema);
  const ESTADO: Record<string, string> = { LISTO: "Listo", PENDIENTE: "Pendiente", SIN_DOCUMENTO: "Sin documento" };
  await enviarExcel(
    res,
    `PR-IMS-08-A02 Paquete ${esquema.replace(/[^\w. -]/g, "")}.xlsx`,
    "Paquete por esquema",
    [
      { encabezado: "Referencia del esquema", valor: (f) => f.referencia, ancho: 22 },
      { encabezado: "Cláusula Norma Integrada", valor: (f) => f.clausula, ancho: 12 },
      { encabezado: "Documentos del sistema", valor: (f) => f.documentos.map((d) => d.codigo).join("; "), ancho: 50 },
      { encabezado: "Registros y herramientas", valor: (f) => f.registros.map((d) => d.codigo).join("; "), ancho: 50 },
      { encabezado: "Carpetas", valor: (f) => f.carpetas.join("; "), ancho: 40 },
      { encabezado: "Estado documental", valor: (f) => ESTADO[f.estado] ?? f.estado, ancho: 16 },
    ],
    filas
  );
}
