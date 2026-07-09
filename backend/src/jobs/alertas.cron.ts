import cron from "node-cron";
import { generarAlertas } from "@/modules/alertas/alertas.service";

/** Corre todos los días a las 06:00 servidor para generar notificaciones automáticas. */
export function iniciarCronAlertas() {
  cron.schedule("0 6 * * *", async () => {
    try {
      await generarAlertas();
      console.log("[cron] Alertas generadas correctamente");
    } catch (err) {
      console.error("[cron] Error generando alertas", err);
    }
  });
}
