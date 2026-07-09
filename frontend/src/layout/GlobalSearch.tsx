import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client";
import type { ResultadoBusqueda } from "@/types";

const TIPO_LABEL: Record<ResultadoBusqueda["tipo"], string> = {
  Documento: "Documento",
  Riesgo: "Riesgo",
  NoConformidad: "No conformidad",
  Auditoria: "Auditoría",
  Proveedor: "Proveedor",
};

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(() => {
      apiClient
        .get<ResultadoBusqueda[]>("/busqueda", { params: { q } })
        .then((res) => {
          setResultados(res.data);
          setAbierto(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timeout);
  }, [q]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  function irA(resultado: ResultadoBusqueda) {
    setAbierto(false);
    setQ("");
    navigate(resultado.ruta);
  }

  return (
    <div ref={contenedorRef} className="relative hidden w-72 sm:block">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => resultados.length > 0 && setAbierto(true)}
        placeholder="Buscar en documentos, riesgos, NC..."
        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {abierto && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {resultados.length === 0 ? (
            <p className="p-3 text-sm text-slate-400">Sin resultados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {resultados.map((r) => (
                <li key={`${r.tipo}-${r.id}`}>
                  <button
                    onClick={() => irA(r)}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-700">{r.titulo}</span>
                    <span className="text-xs text-slate-400">
                      {TIPO_LABEL[r.tipo]} · {r.subtitulo}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
