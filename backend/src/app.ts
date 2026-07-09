import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@/config/env";
import { errorMiddleware, notFoundMiddleware } from "@/middleware/error.middleware";
import { requestIdMiddleware } from "@/middleware/requestId.middleware";
import { apiRateLimiter } from "@/middleware/rateLimit.middleware";
import { authRouter } from "@/modules/auth/auth.routes";
import { areasRouter } from "@/modules/personas/areas.routes";
import { puestosRouter } from "@/modules/personas/puestos.routes";
import { personasRouter } from "@/modules/personas/personas.routes";
import { usuariosRouter } from "@/modules/personas/usuarios.routes";
import { dashboardRouter } from "@/modules/dashboard/dashboard.routes";
import { documentosRouter, tiposDocumentoRouter } from "@/modules/documentos/documentos.routes";
import { objetivosRouter } from "@/modules/objetivos/objetivos.routes";
import { planesRouter } from "@/modules/objetivos/planes.routes";
import { actividadesRouter } from "@/modules/objetivos/actividades.routes";
import { riesgosRouter } from "@/modules/riesgos/riesgos.routes";
import { procesosRouter } from "@/modules/riesgos/procesos.routes";
import { categoriasRiesgoRouter } from "@/modules/riesgos/categorias.routes";
import { ncRouter } from "@/modules/noconformidades/nc.routes";
import { auditoriasRouter } from "@/modules/auditorias/auditorias.routes";
import { programasAuditoriaRouter } from "@/modules/auditorias/programas.routes";
import { indicadoresRouter } from "@/modules/indicadores/indicadores.routes";
import { proveedoresRouter } from "@/modules/proveedores/proveedores.routes";
import { notificacionesRouter } from "@/modules/comunicaciones/notificaciones.routes";
import { tareasRouter } from "@/modules/comunicaciones/tareas.routes";
import { uploadsRouter } from "@/modules/uploads/uploads.routes";
import { busquedaRouter } from "@/modules/busqueda/busqueda.routes";
import { cronRouter } from "@/modules/cron/cron.routes";

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use("/api", apiRateLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/areas", areasRouter);
  app.use("/api/puestos", puestosRouter);
  app.use("/api/personas", personasRouter);
  app.use("/api/usuarios", usuariosRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/documentos", documentosRouter);
  app.use("/api/tipos-documento", tiposDocumentoRouter);
  app.use("/api/objetivos", objetivosRouter);
  app.use("/api/planes", planesRouter);
  app.use("/api/actividades", actividadesRouter);
  app.use("/api/riesgos", riesgosRouter);
  app.use("/api/procesos", procesosRouter);
  app.use("/api/categorias-riesgo", categoriasRiesgoRouter);
  app.use("/api/no-conformidades", ncRouter);
  app.use("/api/auditorias", auditoriasRouter);
  app.use("/api/programas-auditoria", programasAuditoriaRouter);
  app.use("/api/indicadores", indicadoresRouter);
  app.use("/api/proveedores", proveedoresRouter);
  app.use("/api/notificaciones", notificacionesRouter);
  app.use("/api/tareas", tareasRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/busqueda", busquedaRouter);
  app.use("/api/cron", cronRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
