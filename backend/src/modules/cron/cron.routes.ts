import { Router } from "express";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import { asyncHandler } from "@/utils/asyncHandler";
import { generarAlertas } from "@/modules/alertas/alertas.service";

export const cronRouter = Router();

/**
 * Disparador HTTP del mismo job que corre `node-cron` en un servidor
 * tradicional (ver src/jobs/alertas.cron.ts). En Vercel no hay proceso
 * persistente para node-cron, así que en su lugar se configura un Vercel
 * Cron Job (vercel.json) que llama a este endpoint una vez al día con el
 * secreto compartido `CRON_SECRET` como Bearer token.
 */
cronRouter.get(
  "/alertas",
  asyncHandler(async (req, res) => {
    if (!env.cronSecret) {
      throw AppError.badRequest("CRON_SECRET no está configurado en este servidor");
    }
    const header = req.headers.authorization;
    if (header !== `Bearer ${env.cronSecret}`) {
      throw AppError.unauthorized();
    }

    await generarAlertas();
    res.json({ status: "ok" });
  })
);
