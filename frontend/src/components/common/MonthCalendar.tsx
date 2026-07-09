import { useMemo, useState } from "react";

export interface EventoCalendario {
  fecha: string; // ISO
  etiqueta: string;
  color?: "azul" | "rojo" | "amarillo";
}

const DOT_COLOR: Record<NonNullable<EventoCalendario["color"]>, string> = {
  azul: "bg-brand-500",
  rojo: "bg-red-500",
  amarillo: "bg-amber-500",
};

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function claveDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function MonthCalendar({ eventos }: { eventos: EventoCalendario[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>();
    for (const ev of eventos) {
      const clave = ev.fecha.slice(0, 10);
      mapa.set(clave, [...(mapa.get(clave) ?? []), ev]);
    }
    return mapa;
  }, [eventos]);

  const celdas = useMemo(() => {
    const primerDiaMes = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (primerDiaMes.getDay() + 6) % 7; // lunes=0
    const inicio = new Date(primerDiaMes);
    inicio.setDate(inicio.getDate() - offset);

    return Array.from({ length: 42 }, (_, i) => {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + i);
      return dia;
    });
  }, [cursor]);

  const hoy = claveDia(new Date());

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-slate-700">
          {cursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((dia) => {
          const clave = claveDia(dia);
          const eventosDelDia = eventosPorDia.get(clave) ?? [];
          const enMes = dia.getMonth() === cursor.getMonth();
          return (
            <button
              key={clave}
              onClick={() => setDiaSeleccionado(clave)}
              className={`flex h-14 flex-col items-center rounded-md border p-1 text-xs ${
                clave === hoy ? "border-brand-400 bg-brand-50" : "border-transparent hover:bg-slate-50"
              } ${enMes ? "text-slate-700" : "text-slate-300"} ${
                diaSeleccionado === clave ? "ring-2 ring-brand-400" : ""
              }`}
            >
              <span>{dia.getDate()}</span>
              {eventosDelDia.length > 0 && (
                <div className="mt-1 flex gap-0.5">
                  {eventosDelDia.slice(0, 3).map((ev, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[ev.color ?? "azul"]}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div className="mt-3 rounded-md border border-slate-200 p-3">
          <p className="mb-1 text-xs font-medium text-slate-500">
            {new Date(diaSeleccionado + "T00:00:00").toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {(eventosPorDia.get(diaSeleccionado) ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">Sin vencimientos este día.</p>
          ) : (
            <ul className="space-y-1">
              {(eventosPorDia.get(diaSeleccionado) ?? []).map((ev, i) => (
                <li key={i} className="text-sm text-slate-700">
                  {ev.etiqueta}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
