import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { Badge } from "@/components/common/Badge";
import { MonthCalendar, type EventoCalendario } from "@/components/common/MonthCalendar";
import type { Notificacion, Tarea } from "@/types";

function TareasPanel() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);

  function recargar() {
    setCargando(true);
    apiClient.get<Tarea[]>("/tareas").then((res) => setTareas(res.data)).finally(() => setCargando(false));
  }

  useEffect(recargar, []);

  async function actualizarEstado(id: string, estado: string) {
    await apiClient.put(`/tareas/${id}`, { estado });
    recargar();
  }

  if (cargando) return <p className="text-sm text-slate-400">Cargando tareas...</p>;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-600">Mis tareas</h2>
      {tareas.length === 0 ? (
        <p className="text-sm text-slate-400">No tienes tareas asignadas.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {tareas.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <p className="text-slate-700">{t.titulo}</p>
                {t.descripcion && <p className="text-xs text-slate-400">{t.descripcion}</p>}
                {t.fechaVencimiento && (
                  <p className="text-xs text-slate-400">Vence: {new Date(t.fechaVencimiento).toLocaleDateString()}</p>
                )}
              </div>
              <select
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                value={t.estado}
                onChange={(e) => actualizarEstado(t.id, e.target.value)}
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificacionesPanel() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [soloNoLeidas, setSoloNoLeidas] = useState(true);
  const [cargando, setCargando] = useState(true);

  function recargar() {
    setCargando(true);
    apiClient
      .get<Notificacion[]>("/notificaciones", { params: soloNoLeidas ? { leida: false } : {} })
      .then((res) => setNotificaciones(res.data))
      .finally(() => setCargando(false));
  }

  useEffect(recargar, [soloNoLeidas]);

  async function marcarLeida(id: string) {
    await apiClient.put(`/notificaciones/${id}/leida`);
    recargar();
  }

  async function marcarTodasLeidas() {
    await apiClient.put("/notificaciones/marcar-todas-leidas");
    recargar();
  }

  if (cargando) return <p className="text-sm text-slate-400">Cargando notificaciones...</p>;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600">Notificaciones</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-slate-500">
            <input type="checkbox" checked={soloNoLeidas} onChange={(e) => setSoloNoLeidas(e.target.checked)} />
            Solo no leídas
          </label>
          <button onClick={marcarTodasLeidas} className="text-xs font-medium text-brand-600 hover:underline">
            Marcar todas como leídas
          </button>
        </div>
      </div>
      {notificaciones.length === 0 ? (
        <p className="text-sm text-slate-400">Sin notificaciones.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {notificaciones.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  {!n.leida && <Badge color="azul">nuevo</Badge>}
                  <p className="font-medium text-slate-700">{n.titulo}</p>
                </div>
                <p className="text-xs text-slate-400">{n.mensaje}</p>
                <p className="text-xs text-slate-300">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.leida && (
                <button onClick={() => marcarLeida(n.id)} className="whitespace-nowrap text-xs font-medium text-brand-600 hover:underline">
                  Marcar leída
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CalendarioPanel() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient
      .get<Tarea[]>("/tareas")
      .then((res) => setTareas(res.data))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="text-sm text-slate-400">Cargando calendario...</p>;

  const eventos: EventoCalendario[] = tareas
    .filter((t) => t.fechaVencimiento)
    .map((t) => ({
      fecha: t.fechaVencimiento as string,
      etiqueta: t.titulo,
      color: t.estado === "VENCIDA" ? "rojo" : t.estado === "EN_PROCESO" ? "amarillo" : "azul",
    }));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-600">Calendario de vencimientos</h2>
      <MonthCalendar eventos={eventos} />
    </div>
  );
}

export function ComunicacionesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Comunicaciones, Alertas y Tareas</h1>
      <p className="text-sm text-slate-500">
        Estas tareas y notificaciones se generan automáticamente cada día (documentos por vencer,
        NC sin atender, indicadores sin captura, auditorías próximas, acciones vencidas) además de
        las que se crean manualmente desde cada módulo.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TareasPanel />
        <NotificacionesPanel />
      </div>
      <CalendarioPanel />
    </div>
  );
}
