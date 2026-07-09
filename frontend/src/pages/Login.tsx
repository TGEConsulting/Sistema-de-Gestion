import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import logoLaQuinta from "@/assets/logo-la-quinta.png";

const googleHabilitado = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export function Login() {
  const { login, loginConGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@gestion-sgc.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      setError("Credenciales inválidas. Verifica tu email y contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleGoogleSuccess(respuesta: CredentialResponse) {
    setError(null);
    if (!respuesta.credential) return;
    try {
      await loginConGoogle(respuesta.credential);
      navigate("/", { replace: true });
    } catch {
      setError("No se pudo iniciar sesión con Google. Verifica que tu cuenta esté dada de alta.");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panel de marca (visible desde md hacia arriba) */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 to-brand-600 md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_55%)]" />
        <img src={logoLaQuinta} alt="La Quinta" className="relative w-56 drop-shadow-xl" />
        <p className="relative mt-6 max-w-xs text-center text-sm font-medium text-brand-50">
          Sistema de gestión, cumplimiento normativo y mejora continua
        </p>
      </div>

      {/* Formulario */}
      <div className="flex w-full flex-1 items-center justify-center bg-slate-50 px-4 dark:bg-slate-950 md:w-1/2">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <img src={logoLaQuinta} alt="La Quinta" className="mx-auto w-24 md:hidden" />
          <h1 className="mt-3 text-center text-2xl font-bold text-brand-800 dark:text-brand-400 md:mt-0">
            Gestión SGC
          </h1>
          <p className="mt-1 text-center text-sm text-slate-400">
            Sistema de gestión, cumplimiento y riesgos
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {enviando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {googleHabilitado && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400">o</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("No se pudo iniciar sesión con Google.")}
                  text="signin_with"
                />
              </div>
            </>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            Usuario de prueba: admin@gestion-sgc.local / Admin123!
          </p>
        </div>
      </div>
    </div>
  );
}
