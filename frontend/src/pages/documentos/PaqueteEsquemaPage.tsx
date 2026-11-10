import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { Badge } from "@/components/common/Badge";
import { StatCard } from "@/components/common/StatCard";
import { inputClass } from "@/components/common/FormField";
import { descargarArchivo } from "@/lib/descargas";
import type { EsquemaDisponible, FilaPaqueteEsquema } from "@/types";

const ESTADO: Record<FilaPaqueteEsquema["estado"], { etiqueta: string; color: "verde" | "amarillo" | "rojo" }> = {
  LISTO: { etiqueta: "Listo", color: "verde" },
  PENDIENTE: { etiqueta: "Pendiente", color: "amarillo" },
  SIN_DOCUMENTO: { etiqueta: "Sin documento", color: "rojo" },
};
const DOC_ESTADO: Record<string, string> = { BORRADOR: "Por elaborar", EN_REVISION: "En revisión", APROBADO: "Emitido", OBSOLETO: "Obsoleto" };

export function PaqueteEsquemaPage() {
  const [esquemas, setEsquemas] = useState<EsquemaDisponible[]>([]);
  const [esquema, setEsquema] = useState("");
  const [filas, setFilas] = useState<FilaPaqueteEsquema[]>([]);
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<EsquemaDisponible[]>("/documentos/paquete-esquema/esquemas").then((res) => {
      setEsquemas(res.data);
      const fssc = res.data.find((e) => e.esquema.startsWith("FSSC"));
      setEsquema(fssc?.esquema ?? res.data[0]?.esquema ?? "");
    });
  }, []);

  useEffect(() => {
    if (!esquema) return;
    setCargando(true);
    apiClient
      .get<FilaPaqueteEsquema[]>("/documentos/paquete-esquema", { params: { esquema } })
      .then((res) => setFilas(res.data))
      .finally(() => setCargando(false));
  }, [esquema]);

  const visibles = soloPendientes ? filas.filter((f) => f.estado !== "LISTO") : filas;
  const listos = filas.filter((f) => f.estado === "LISTO").length;
  const sinDoc = filas.filter((f) => f.estado === "SIN_DOCUMENTO").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Paquete de evidencias por esquema</h1>
          <p className="text-sm text-slate-400">PR-IMS-08-A02 · cada requisito del esquema → cláusula de la Norma Integrada → documentos y registros que lo cubren.</p>
        </div>
        <button onClick={() => descargarArchivo("/documentos/paquete-esquema/export", { esquema }, "PR-IMS-08-A02.xlsx")} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Exportar a Excel</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className={`${inputClass} w-auto`} value={esquema} onChange={(e) => setEsquema(e.target.value)}>
          {esquemas.map((e) => <option key={e.esquema} value={e.esquema}>{e.esquema} ({e.referencias})</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
          Solo pendientes
        </label>
      </div>

      {filas.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard titulo="Requisitos del esquema" valor={filas.length} />
          <StatCard titulo="Con documentos listos" valor={`${listos} (${Math.round((listos / filas.length) * 100)}%)`} color="verde" />
          <StatCard titulo="Sin documento" valor={sinDoc} color={sinDoc ? "rojo" : "verde"} />
        </div>
      )}

      {cargando ? <p className="text-sm text-slate-400">Cargando paquete...</p> : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Referencia del esquema</th>
                <th className="px-3 py-2">Cláusula Norma</th>
                <th className="px-3 py-2">Documentos</th>
                <th className="px-3 py-2">Registros / herramientas</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((f) => {
                const key = `${f.referencia}|${f.clausula}`;
                const open = abierta === key;
                return (
                  <tr key={key} className="align-top hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{f.referencia}</td>
                    <td className="px-3 py-2 text-slate-600">{f.clausula}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {f.documentos.length === 0 ? "—" : (
                        <>
                          {(open ? f.documentos : f.documentos.slice(0, 4)).map((d) => (
                            <div key={d.codigo} title={`${d.titulo} · ${DOC_ESTADO[d.estado] ?? d.estado} · ${d.carpeta ?? ""}`}>
                              <span className="font-mono text-xs">{d.codigo}</span> <span className="text-slate-500">{d.titulo.length > 50 ? d.titulo.slice(0, 50) + "…" : d.titulo}</span>
                            </div>
                          ))}
                          {f.documentos.length > 4 && (
                            <button className="text-xs text-brand-600 hover:underline" onClick={() => setAbierta(open ? null : key)}>
                              {open ? "ver menos" : `+ ${f.documentos.length - 4} más`}
                            </button>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{f.registros.length === 0 ? "—" : open ? f.registros.map((r) => r.codigo).join(" · ") : `${f.registros.length} registros`}</td>
                    <td className="px-3 py-2"><Badge color={ESTADO[f.estado].color}>{ESTADO[f.estado].etiqueta}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
