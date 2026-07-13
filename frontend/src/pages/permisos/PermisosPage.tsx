import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { FilaPermisosRol, ModuloSistema, NivelPermiso } from "@/types";

const MODULOS: { valor: ModuloSistema; etiqueta: string }[] = [
  { valor: "DOCUMENTOS", etiqueta: "Documentos" },
  { valor: "OBJETIVOS", etiqueta: "Objetivos y Planes" },
  { valor: "RIESGOS", etiqueta: "Riesgos" },
  { valor: "NO_CONFORMIDADES", etiqueta: "No Conformidades" },
  { valor: "AUDITORIAS", etiqueta: "Auditorías" },
  { valor: "INDICADORES", etiqueta: "Indicadores" },
  { valor: "PERSONAS", etiqueta: "Personas y Roles" },
  { valor: "PROVEEDORES", etiqueta: "Proveedores" },
  { valor: "COMUNICACIONES", etiqueta: "Tareas y Alertas" },
  { valor: "GESTION_CAMBIOS", etiqueta: "Gestión de Cambios" },
];

const NIVELES: { valor: NivelPermiso; etiqueta: string }[] = [
  { valor: "NINGUNO", etiqueta: "Ninguno" },
  { valor: "VER", etiqueta: "Ver" },
  { valor: "EDITAR", etiqueta: "Editar" },
  { valor: "APROBAR", etiqueta: "Aprobar" },
];

export function PermisosPage() {
  const { usuario } = useAuth();
  const [matriz, setMatriz] = useState<FilaPermisosRol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario?.rol !== "ADMIN") return;
    apiClient
      .get<FilaPermisosRol[]>("/permisos")
      .then((res) => setMatriz(res.data))
      .catch(() => setError("No se pudo cargar la matriz de permisos."))
      .finally(() => setCargando(false));
  }, [usuario?.rol]);

  if (usuario?.rol !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  function cambiarNivel(rolId: string, modulo: ModuloSistema, nivel: NivelPermiso) {
    setMatriz((prev) =>
      prev.map((fila) =>
        fila.rolId !== rolId
          ? fila
          : {
              ...fila,
              permisos: fila.permisos.map((p) => (p.modulo === modulo ? { ...p, nivel } : p)),
            }
      )
    );
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    setError(null);
    try {
      const permisos = matriz.flatMap((fila) =>
        fila.permisos.map((p) => ({ rolId: fila.rolId, modulo: p.modulo, nivel: p.nivel }))
      );
      const { data } = await apiClient.put<FilaPermisosRol[]>("/permisos", { permisos });
      setMatriz(data);
      setMensaje("Cambios guardados correctamente.");
    } catch {
      setError("No se pudieron guardar los cambios. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Permisos</h1>
          <p className="text-sm text-slate-400">
            Definí qué nivel de acceso tiene cada rol en cada módulo del sistema.
          </p>
        </div>
        <button
          onClick={guardar}
          disabled={guardando || cargando}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {mensaje && <p className="text-sm text-green-600">{mensaje}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando matriz de permisos...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="sticky left-0 bg-slate-50 px-4 py-2 text-left font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Rol
                </th>
                {MODULOS.map((modulo) => (
                  <th
                    key={modulo.valor}
                    className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300"
                  >
                    {modulo.etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {matriz.map((fila) => (
                <tr key={fila.rolId}>
                  <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-2 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {fila.rol}
                  </td>
                  {MODULOS.map((modulo) => {
                    const permiso = fila.permisos.find((p) => p.modulo === modulo.valor);
                    return (
                      <td key={modulo.valor} className="px-3 py-2">
                        <select
                          value={permiso?.nivel ?? "NINGUNO"}
                          onChange={(e) =>
                            cambiarNivel(fila.rolId, modulo.valor, e.target.value as NivelPermiso)
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          {NIVELES.map((nivel) => (
                            <option key={nivel.valor} value={nivel.valor}>
                              {nivel.etiqueta}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
