import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import * as dashboardService from "./dashboard.service";

export async function resumen(req: Request, res: Response) {
  if (!req.auth) throw AppError.unauthorized();
  const data = await dashboardService.obtenerResumen(req.auth.sub);
  res.json(data);
}
