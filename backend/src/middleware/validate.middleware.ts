import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "@/utils/AppError";

type Target = "body" | "query" | "params";

// Valida req[target] contra un schema de zod y reemplaza el valor por la versión
// parseada (con defaults y coerciones aplicadas).
export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw AppError.badRequest("Datos de entrada inválidos", result.error.flatten());
    }
    (req as unknown as Record<Target, unknown>)[target] = result.data;
    next();
  };
}
