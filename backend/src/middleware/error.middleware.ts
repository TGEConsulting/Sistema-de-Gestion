import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({ error: "Ruta no encontrada", requestId: req.requestId });
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error(`[${req.requestId}] ${req.method} ${req.originalUrl}`, err);
    }
    return res
      .status(err.statusCode)
      .json({ error: err.message, details: err.details, requestId: req.requestId });
  }

  console.error(`[${req.requestId}] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({ error: "Error interno del servidor", requestId: req.requestId });
}
