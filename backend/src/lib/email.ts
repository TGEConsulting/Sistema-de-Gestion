import { Resend } from "resend";
import { env } from "../config/env";

let cliente: Resend | null = null;
function obtenerCliente(): Resend | null {
  if (!env.resendApiKey) return null;
  if (!cliente) cliente = new Resend(env.resendApiKey);
  return cliente;
}

const NOMBRES_ROL: Record<string, string> = {
  ADMIN: "Administrador",
  AUDITOR: "Auditor",
  RESPONSABLE_PROCESO: "Responsable de proceso",
  LECTURA: "Solo lectura",
};

// Envía el correo de bienvenida con las credenciales de acceso. Si Resend no está
// configurado (falta RESEND_API_KEY) no hace nada: crear el usuario nunca debe
// fallar por un problema de correo, el admin igual puede comunicarle la clave a mano.
export async function enviarCorreoBienvenida(datos: {
  email: string;
  nombre: string;
  password: string;
  rol: string;
}): Promise<void> {
  const resend = obtenerCliente();
  if (!resend) return;

  const rolLegible = NOMBRES_ROL[datos.rol] ?? datos.rol;

  await resend.emails.send({
    from: env.resendFromEmail,
    to: datos.email,
    subject: "Tu cuenta en Gestión SGC",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0b4c8c;">¡Bienvenido/a a Gestión SGC!</h2>
        <p>Hola ${datos.nombre},</p>
        <p>Se creó tu cuenta con rol <strong>${rolLegible}</strong>. Podés iniciar sesión con:</p>
        <ul>
          <li><strong>Email:</strong> ${datos.email}</li>
          <li><strong>Contraseña temporal:</strong> ${datos.password}</li>
        </ul>
        <p>Te recomendamos cambiar tu contraseña después de tu primer ingreso.</p>
        <p>
          <a href="${env.appUrl}/login" style="display: inline-block; background: #1ca3e0; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Ingresar al sistema
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          Si no esperabas este correo, podés ignorarlo.
        </p>
      </div>
    `,
  });
}
