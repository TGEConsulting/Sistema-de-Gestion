import { NavLink } from "react-router-dom";
import logoLaQuinta from "@/assets/logo-la-quinta.png";
import { useAuth } from "@/context/AuthContext";

const MODULOS = [
  { path: "/", label: "Dashboard", icon: "📊", end: true },
  { path: "/documentos", label: "Documentos", icon: "📄" },
  { path: "/objetivos", label: "Objetivos y Planes", icon: "🎯" },
  { path: "/riesgos", label: "Riesgos", icon: "⚠️" },
  { path: "/no-conformidades", label: "No Conformidades", icon: "🛠️" },
  { path: "/auditorias", label: "Auditorías", icon: "🔍" },
  { path: "/indicadores", label: "Indicadores", icon: "📈" },
  { path: "/personas", label: "Personas y Roles", icon: "👥" },
  { path: "/proveedores", label: "Proveedores", icon: "🚚" },
  { path: "/comunicaciones", label: "Tareas y Alertas", icon: "🔔" },
  { path: "/cambios", label: "Gestión de Cambios", icon: "🔄" },
];

const MODULO_PERMISOS = { path: "/permisos", label: "Permisos", icon: "🔐", end: false };

function Contenido({ onNavegar }: { onNavegar?: () => void }) {
  const { usuario } = useAuth();
  const modulos = usuario?.rol === "ADMIN" ? [...MODULOS, MODULO_PERMISOS] : MODULOS;

  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-700">
        <img src={logoLaQuinta} alt="La Quinta" className="h-9 w-9" />
        <span className="text-lg font-bold leading-tight text-brand-800 dark:text-brand-400">Gestión SGC</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {modulos.map((modulo) => (
          <NavLink
            key={modulo.path}
            to={modulo.path}
            end={modulo.end}
            onClick={onNavegar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-500"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`
            }
          >
            <span>{modulo.icon}</span>
            {modulo.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  return (
    <>
      {/* Desktop: fija en la columna izquierda */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:flex md:flex-col">
        <Contenido />
      </aside>

      {/* Móvil: drawer superpuesto */}
      {abierta && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={onCerrar} />
          <aside className="relative flex h-full w-64 flex-col bg-white dark:bg-slate-900">
            <Contenido onNavegar={onCerrar} />
          </aside>
        </div>
      )}
    </>
  );
}
