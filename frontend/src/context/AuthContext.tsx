import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "@/api/client";
import type { UsuarioSesion } from "@/types";

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginConGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sgc_token");
    const usuarioGuardado = localStorage.getItem("sgc_usuario");
    if (token && usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  function guardarSesion(data: { token: string; usuario: UsuarioSesion }) {
    localStorage.setItem("sgc_token", data.token);
    localStorage.setItem("sgc_usuario", JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  async function login(email: string, password: string) {
    const { data } = await apiClient.post("/auth/login", { email, password });
    guardarSesion(data);
  }

  async function loginConGoogle(credential: string) {
    const { data } = await apiClient.post("/auth/google", { credential });
    guardarSesion(data);
  }

  function logout() {
    localStorage.removeItem("sgc_token");
    localStorage.removeItem("sgc_usuario");
    setUsuario(null);
  }

  const value = useMemo(
    () => ({ usuario, cargando, login, loginConGoogle, logout }),
    [usuario, cargando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
