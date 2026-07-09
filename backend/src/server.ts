import { createApp } from "./app";
import { env } from "./config/env";
import { iniciarCronAlertas } from "./jobs/alertas.cron";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Gestion SGC API escuchando en http://localhost:${env.port}`);
  iniciarCronAlertas();
});
