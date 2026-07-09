import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

// Identificador único por request, útil para correlacionar logs de una misma
// petición (incluido el log de error) sin depender de un APM externo.
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId = req.headers["x-request-id"]?.toString() ?? crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
