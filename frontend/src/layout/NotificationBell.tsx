import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client";
import type { Notificacion } from "@/types";

const INTERVALO_POLLING_MS = 30_000;

export function NotificationBell() {
  const [noLeidas, setNoLeidas] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    function consultar() {
      apiClient
        .get<Notificacion[]>("/notificaciones", { params: { leida: false } })
        .then((res) => setNoLeidas(res.data.length))
        .catch(() => {});
    }

    consultar();
    const intervalo = setInterval(consultar, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <button
      onClick={() => navigate("/comunicaciones")}
      title="Notificaciones"
      className="relative rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
    >
      🔔
      {noLeidas > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
          {noLeidas > 99 ? "99+" : noLeidas}
        </span>
      )}
    </button>
  );
}
