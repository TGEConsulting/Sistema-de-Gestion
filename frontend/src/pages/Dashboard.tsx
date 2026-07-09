import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiClient } from "@/api/client";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/common/Badge";
import type { DashboardSummary } from "@/types";

const ESTADO_COLOR: Record<string, "gris" | "azul" | "verde" | "amarillo" | "rojo"> = {
  BORRADOR: "gris",
  EN_REVISION: "amarillo",
  APROBADO: "verde",
  OBSOLETO: "rojo",
  ABIERTA: "rojo",
  EN_ANALISIS: "amarillo",
  ACCION_DEFINIDA: "amarillo",
  EN_IMPLEMENTACION: "azul",
  CERRADA: "verde",
  BAJO: "verde",
  MODERADO: "amarillo",
  ALTO: "rojo",
  CRITICO: "rojo",
};

export function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient
      .get<DashboardSummary>("/dashboard/summary")
      .then((res) => setData(res.data))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="text-sm text-slate-400">Cargando panel...</p>;
  }

  if (!data) {
    return <p className="text-sm text-red-500">No fue posible cargar el panel.</p>;
  }

  const riesgosChart = data.riesgosPorNivel.map((r) => ({ nombre: r.nivel, total: r.total }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Panel general</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Tareas pendientes" valor={data.tareasPendientes.length} color="azul" />
        <StatCard titulo="Notificaciones sin leer" valor={data.notificacionesNoLeidas.length} color="amarillo" />
        <StatCard
          titulo="Indicadores en verde"
          valor={data.semaforoIndicadores.VERDE}
          subtitulo={`de ${
            data.semaforoIndicadores.VERDE +
            data.semaforoIndicadores.AMARILLO +
            data.semaforoIndicadores.ROJO +
            data.semaforoIndicadores.SIN_DATOS
          } indicadores activos`}
          color="verde"
        />
        <StatCard
          titulo="Próximas auditorías"
          valor={data.proximasAuditorias.length}
          color="rojo"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Riesgos activos por nivel</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riesgosChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b6fed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Mis tareas pendientes</h2>
          {data.tareasPendientes.length === 0 ? (
            <p className="text-sm text-slate-400">No tienes tareas pendientes.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.tareasPendientes.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-700">{t.titulo}</span>
                  <Badge color={t.estado === "VENCIDA" ? "rojo" : "azul"}>{t.estado}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Documentos por estado</h2>
          <ul className="space-y-2">
            {data.documentosPorEstado.map((d) => (
              <li key={d.estado} className="flex items-center justify-between text-sm">
                <Badge color={ESTADO_COLOR[d.estado] ?? "gris"}>{d.estado}</Badge>
                <span className="font-medium text-slate-700">{d.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">No conformidades por estado</h2>
          <ul className="space-y-2">
            {data.noConformidadesPorEstado.map((n) => (
              <li key={n.estado} className="flex items-center justify-between text-sm">
                <Badge color={ESTADO_COLOR[n.estado] ?? "gris"}>{n.estado}</Badge>
                <span className="font-medium text-slate-700">{n.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Avisos recientes</h2>
          {data.notificacionesNoLeidas.length === 0 ? (
            <p className="text-sm text-slate-400">Sin avisos pendientes.</p>
          ) : (
            <ul className="space-y-2">
              {data.notificacionesNoLeidas.slice(0, 5).map((n) => (
                <li key={n.id} className="text-sm">
                  <p className="font-medium text-slate-700">{n.titulo}</p>
                  <p className="text-xs text-slate-400">{n.mensaje}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
