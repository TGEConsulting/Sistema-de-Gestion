import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",

  // Opcionales: la app funciona sin ellas, pero las features asociadas
  // (login con Google, subida de archivos) responden con un error claro
  // en vez de fallar al arrancar, para no bloquear el resto del desarrollo
  // mientras se consiguen las credenciales.
  googleClientId: process.env.GOOGLE_CLIENT_ID,

  gcsProjectId: process.env.GCS_PROJECT_ID,
  gcsBucket: process.env.GCS_BUCKET,
  gcsCredentialsJson: process.env.GCS_CREDENTIALS_JSON,

  cronSecret: process.env.CRON_SECRET,
  isVercel: process.env.VERCEL === "1",
};
