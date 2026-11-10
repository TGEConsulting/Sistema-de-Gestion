import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { descargarArchivo } from "@/lib/descargas";
import type { ComunicacionInterfaz, EstadoInterfaz, RefNombre, ResumenInterfazArea } from "@/types";

const ESTADOS: { valor: EstadoInterfaz; etiqueta: string; color: "gris" | "azul" | "verde" | "amarillo" | "rojo" }[] = [
  { valor: "PROPUESTA", etiqueta: "Propuesta", color: "amarillo" },
  { valor: "ACEPTADA", etiqueta: "Aceptada", color: "verde" },
  { valor: "CON_AJUSTE", etiqueta: "Con ajuste", color: "azul" },
  { valor: "RECHAZADA", etiqueta: "Rechazada", color: "rojo" },
];
const ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.valor, e])) as Record<EstadoInterfaz, (typeof ESTADOS)[number]>;

function NuevaInterfazForm({ areas, onCreado, onCancelar }: { areas: RefNombre[]; onCreado: () => void; onCancelar: () => void }) {
  const [form, setForm] = useState({ documentoCodigo: "", documentoTitulo: "", areaDuenaId: "", areaContraparteId: "", contraparteTexto: "", entrega: "", recibe: "", plazo: "" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const contraparte = areas.find((a) => a.id === form.areaContraparteId);
      await apiClient.post("/matriz-comunicacion", {
        ...Object.fromEntries(Object.entries(form).filter(([, v]) => v !== "")),
        contraparteTexto: form.contraparteTexto || contraparte?.nombre,
      });
      onCreado();
    } catch {
      setError("No se pudo crear la interfaz. Indicá procedimiento, gerencia dueña y contraparte.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Procedimiento (código)">
          <input required className={inputClass} placeholder="PR-FS-01" value={form.documentoCodigo} onChange={(e) => setForm({ ...form, documentoCodigo: e.target.value })} />
        </FormField>
        <FormField label="Título del procedimiento">
          <input className={inputClass} value={form.documentoTitulo} onChange={(e) => setForm({ ...form, documentoTitulo: e.target.value })} />
        </FormField>
        <FormField label="Gerencia dueña del procedimiento">
          <select required className={inputClass} value={form.areaDuenaId} onChange={(e) => setForm({ ...form, areaDuenaId: e.target.value })}>
            <option value="">Seleccionar</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Gerencia contraparte">
          <select className={inputClass} value={form.areaContraparteId} onChange={(e) => setForm({ ...form, areaContraparteId: e.target.value })}>
            <option value="">Externa / otra (escribir abajo)</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Contraparte (texto, para externos: cliente, autoridad, proveedor)">
        <input className={inputClass} value={form.contraparteTexto} onChange={(e) => setForm({ ...form, contraparteTexto: e.target.value })} />
      </FormField>
      <FormField label="Qué entrega la contraparte al proceso">
        <textarea className={inputClass} value={form.entrega} onChange={(e) => setForm({ ...form, entrega: e.target.value })} />
      </FormField>
      <FormField label="Qué recibe la contraparte del proceso">
        <textarea className={inputClass} value={form.recibe} onChange={(e) => setForm({ ...form, recibe: e.target.value })} />
      </FormField>
      <FormField label="Plazo / frecuencia">
        <input className={inputClass} value={form.plazo} onChange={(e) => setForm({ ...form, plazo: e.target.value })} />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">Cancelar</button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">Crear interfaz</button>
      </div>
    </form>
  );
}

function RevisarInterfaz({ interfaz, onCerrar, onCambio }: { interfaz: ComunicacionInterfaz; onCerrar: () => void; onCambio: () => void }) {
  const [estado, setEstado] = useState<EstadoInterfaz>(interfaz.estado === "PROPUESTA" ? "ACEPTADA" : interfaz.estado);
  const [observacion, setObservacion] = useState(interfaz.observacion ?? "");
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setProcesando(true);
    setError(null);
    try {
      await apiClient.post(`/matriz-comunicacion/${interfaz.id}/revisar`, { estado, observacion: observacion || undefined });
      onCambio();
      onCerrar();
    } catch {
      setError("No se pudo registrar la revisión (para ajuste o rechazo la observación es obligatoria).");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <p className="text-xs text-slate-400">{interfaz.documentoCodigo} · {interfaz.documentoTitulo}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-slate-400">Gerencia dueña</dt><dd className="text-slate-700">{interfaz.areaDuena?.nombre}</dd></div>
        <div><dt className="text-slate-400">Contraparte</dt><dd className="text-slate-700">{interfaz.areaContraparte?.nombre ?? interfaz.contraparteTexto}</dd></div>
        <div className="col-span-2"><dt className="text-slate-400">La contraparte entrega</dt><dd className="text-slate-700">{interfaz.entrega ?? "—"}</dd></div>
        <div className="col-span-2"><dt className="text-slate-400">La contraparte recibe</dt><dd className="text-slate-700">{interfaz.recibe ?? "—"}</dd></div>
        <div><dt className="text-slate-400">Plazo</dt><dd className="text-slate-700">{interfaz.plazo ?? "—"}</dd></div>
      </dl>
      <FormField label="Revisión de la gerencia contraparte">
        <select className={inputClass} value={estado} onChange={(e) => setEstado(e.target.value as EstadoInterfaz)}>
          {ESTADOS.filter((e) => e.valor !== "PROPUESTA").map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
        </select>
      </FormField>
      <FormField label="Observación / ajuste propuesto">
        <textarea className={inputClass} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCerrar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">Cerrar</button>
        <button type="submit" disabled={procesando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">Guardar revisión</button>
      </div>
    </form>
  );
}

export function MatrizComunicacionPage() {
  const [areas, setAreas] = useState<RefNombre[]>([]);
  const [resumen, setResumen] = useState<ResumenInterfazArea[]>([]);
  const [filtros, setFiltros] = useState({ areaId: "", estado: "", q: "" });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionada, setSeleccionada] = useState<ComunicacionInterfaz | null>(null);

  const { items, pagination, setPage, cargando, recargar } = usePaginatedList<ComunicacionInterfaz>("/matriz-comunicacion", filtros);

  function cargarResumen() {
    apiClient.get<ResumenInterfazArea[]>("/matriz-comunicacion/resumen").then((res) => setResumen(res.data));
  }
  useEffect(() => {
    apiClient.get<RefNombre[]>("/areas").then((res) => setAreas(res.data)).catch(() => setAreas([]));
    cargarResumen();
  }, []);

  const columnas: Columna<ComunicacionInterfaz>[] = [
    { encabezado: "Procedimiento", render: (f) => <span title={f.documentoTitulo ?? ""}>{f.documentoCodigo}</span> },
    { encabezado: "Gerencia dueña", render: (f) => f.areaDuena?.nombre ?? "—" },
    { encabezado: "Contraparte", render: (f) => f.areaContraparte?.nombre ?? f.contraparteTexto },
    { encabezado: "La contraparte entrega", render: (f) => f.entrega ?? "—" },
    { encabezado: "La contraparte recibe", render: (f) => f.recibe ?? "—" },
    { encabezado: "Plazo", render: (f) => f.plazo ?? "—" },
    { encabezado: "Estado", render: (f) => <Badge color={ESTADO[f.estado].color}>{ESTADO[f.estado].etiqueta}</Badge> },
    { encabezado: "", render: (f) => <button onClick={() => setSeleccionada(f)} className="text-sm font-medium text-brand-600 hover:underline">Revisar</button> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Matriz de comunicación entre gerencias</h1>
          <p className="text-sm text-slate-400">PR-IMS-04-F02 · qué entrega y qué recibe cada gerencia en cada procedimiento; cada contraparte acepta o pide ajuste (revisión cruzada).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => descargarArchivo("/matriz-comunicacion/export", filtros, "PR-IMS-04-F02.xlsx")} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Exportar a Excel</button>
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">+ Nueva interfaz</button>
        </div>
      </div>

      {resumen.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Gerencia</th>
                <th className="px-3 py-2 text-right">Interfaces</th>
                <th className="px-3 py-2 text-right">Como dueña</th>
                <th className="px-3 py-2 text-right">Como contraparte</th>
                <th className="px-3 py-2 text-right">Aceptadas</th>
                <th className="px-3 py-2 text-right">Pendientes</th>
                <th className="px-3 py-2 text-right">Con ajuste / rechazo</th>
                <th className="px-3 py-2 text-right">% aceptación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resumen.map((r) => (
                <tr key={r.areaId} className={`cursor-pointer hover:bg-slate-50 ${filtros.areaId === r.areaId ? "bg-brand-50" : ""}`} onClick={() => setFiltros({ ...filtros, areaId: filtros.areaId === r.areaId ? "" : r.areaId })}>
                  <td className="px-3 py-1.5 text-slate-700">{r.area}</td>
                  <td className="px-3 py-1.5 text-right">{r.total}</td>
                  <td className="px-3 py-1.5 text-right">{r.comoDuena}</td>
                  <td className="px-3 py-1.5 text-right">{r.comoContraparte}</td>
                  <td className="px-3 py-1.5 text-right text-emerald-700">{r.aceptadas}</td>
                  <td className="px-3 py-1.5 text-right text-amber-700">{r.pendientes}</td>
                  <td className="px-3 py-1.5 text-right text-red-700">{r.conAjuste}</td>
                  <td className="px-3 py-1.5 text-right">{r.total ? Math.round((r.aceptadas / r.total) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input className={`${inputClass} w-64`} placeholder="Buscar procedimiento, contraparte, entrega..." value={filtros.q} onChange={(e) => setFiltros({ ...filtros, q: e.target.value })} />
        <select className={`${inputClass} w-auto`} value={filtros.areaId} onChange={(e) => setFiltros({ ...filtros, areaId: e.target.value })}>
          <option value="">Todas las gerencias (mis interfaces)</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <select className={`${inputClass} w-auto`} value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
        </select>
      </div>

      {cargando ? <p className="text-sm text-slate-400">Cargando interfaces...</p> : (
        <>
          <DataTable columnas={columnas} filas={items} vacio="No hay interfaces registradas." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nueva interfaz de comunicación" onClose={() => setMostrarForm(false)}>
          <NuevaInterfazForm areas={areas} onCreado={() => { setMostrarForm(false); recargar(); cargarResumen(); }} onCancelar={() => setMostrarForm(false)} />
        </Modal>
      )}
      {seleccionada && (
        <Modal titulo="Revisión de la interfaz" onClose={() => setSeleccionada(null)}>
          <RevisarInterfaz interfaz={seleccionada} onCerrar={() => setSeleccionada(null)} onCambio={() => { recargar(); cargarResumen(); }} />
        </Modal>
      )}
    </div>
  );
}
