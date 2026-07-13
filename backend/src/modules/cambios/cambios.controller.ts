import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { enviarExcel } from "../../utils/excel";
import * as cambiosService from "./cambios.service";

const CATEGORIA_LABEL: Record<string, string> = {
  MATERIA_PRIMA_PROCESO_EQUIPO: "Materia prima, proveedor, proceso o equipo",
  ETIQUETADO_DECLARACION: "Etiquetado y declaraciones del producto",
  PPR_CONTROL_OPERACIONAL: "PPR y controles operacionales",
  REQUISITO_ESQUEMA_BOS: "Requisitos de esquema / decisión BoS",
  ALCANCE_CERTIFICACION: "Alcance de certificación",
};

export async function listar(req: Request, res: Response) {
  res.json(await cambiosService.listarCambios(req.query as never));
}

export async function exportar(req: Request, res: Response) {
  const cambios = await cambiosService.listarCambiosParaExportar(req.query as never);
  await enviarExcel(
    res,
    "gestion-cambios.xlsx",
    "Gestión de Cambios",
    [
      { encabezado: "Código", valor: (c) => c.codigo },
      { encabezado: "Título", valor: (c) => c.titulo, ancho: 40 },
      { encabezado: "Categoría", valor: (c) => CATEGORIA_LABEL[c.categoria] ?? c.categoria, ancho: 35 },
      { encabezado: "Estado", valor: (c) => c.estado },
      { encabezado: "Solicitante", valor: (c) => c.solicitante.nombre },
      { encabezado: "Impacto en inocuidad/cumplimiento", valor: (c) => c.impactoInocuidad, ancho: 45 },
      { encabezado: "Fecha efectiva", valor: (c) => c.fechaEfectiva },
      { encabezado: "Plazo de transición", valor: (c) => c.plazoTransicion },
      { encabezado: "Comunicado por", valor: (c) => c.comunicadoPor?.nombre ?? "" },
      { encabezado: "Fecha de comunicación", valor: (c) => c.fechaComunicacion },
      { encabezado: "Fecha de implementación", valor: (c) => c.fechaImplementacion },
    ],
    cambios
  );
}

export async function obtener(req: Request, res: Response) {
  res.json(await cambiosService.obtenerCambio(req.params.id));
}

export async function crear(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  res.status(201).json(await cambiosService.crearCambio(req.body, req.auth.sub));
}

export async function actualizar(req: Request, res: Response) {
  res.json(await cambiosService.actualizarCambio(req.params.id, req.body));
}

export async function eliminar(req: Request, res: Response) {
  await cambiosService.eliminarCambio(req.params.id);
  res.status(204).send();
}

export async function comunicar(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  res.json(await cambiosService.comunicarCambio(req.params.id, req.auth.sub));
}

export async function implementar(req: Request, res: Response) {
  res.json(await cambiosService.implementarCambio(req.params.id, req.body));
}

export async function cancelar(req: Request, res: Response) {
  res.json(await cambiosService.cancelarCambio(req.params.id));
}
