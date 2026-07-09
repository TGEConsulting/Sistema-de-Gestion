import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { NotificationBell } from "@/layout/NotificationBell";
import { GlobalSearch } from "@/layout/GlobalSearch";

export function Topbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { usuario, logout } = useAuth();
  const { oscuro, toggle } = useDarkMode();

  async function cerrarTodas() {
    await apiClient.post("/auth/logout-all");
    logout();
  }

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onAbrirMenu}
          className="rounded-md border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 md:hidden"
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {oscuro ? "☀️" : "🌙"}
        </button>
        <NotificationBell />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{usuario?.nombre}</p>
          <p className="text-xs text-slate-400">{usuario?.rol}</p>
        </div>
        <button
          onClick={cerrarTodas}
          title="Invalida todos los tokens ya emitidos para tu cuenta, en todos los dispositivos"
          className="hidden rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:inline-block"
        >
          Cerrar todas las sesiones
        </button>
        <button
          onClick={logout}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
