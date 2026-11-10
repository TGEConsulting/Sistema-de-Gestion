import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { Pagination } from "@/components/common/Pagination";
import { StatCard } from "@/components/common/StatCard";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { descargarArchivo } from "@/lib/descargas";
import type { EstadoCumplimientoRequisito, RefNombre, Requisito, ResumenRequisitos, TipoRequisito } from "@/types";

const TIPOS: { valor: TipoRequisito; etiqueta: string }[] = [
  { valor: "LEGAL", etiqueta: "Legal (ley, reglamento, NOM)" },
  { valor: "ESQUEMA", etiqueta: "Esquema (FSSC, ISO, GFSI)" },
  { valor: "CLIENTE", etiqueta: "Cliente" },
  { valor: "OTRO", etiqueta: "Otro" },
];
const TIPO_LABEL = Object.fromEntries(TIPOS.map((t) => [t.valor, t.etiqueta.split(" (")[0]])) as Record<TipoRequisito, string>;
const ESTADOS: { valor: EstadoCumplimientoRequisito; etiqueta: string; color: "gris" | "azul" | "verde" | "amarillo" | "rojo" }[] = [
  { valor: "POR_EVALUAR", etiqueta: "Por evaluar", color: "amarillo" },
  { valor: "CUMPLE", etiqueta: "Cumple", color: "verde" },
  { valor: "PARCIAL", etiqueta: "Parcial", color: "azul" },
  { valor: "NO_CUMPLE", etiqueta: "No cumple", color: "rojo" },
  { valor: "NO_APLICA", etiqueta: "No aplica", color: "gris" },
];
const ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.valor, e])) as Record<EstadoCumplimientoRequisito, (typeof ESTADOS)[number]>;

function fecha(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("es-MX") : "—";
}

function NuevoRequisitoForm({ areas, usuarios, onCreado, onCancelar }: { areas: RefNombre[]; usuarios: RefNombre[]; onCreado: () => void; onCancelar: () => void }) {
  const [form, setForm] = useState({ tipo: "LEGAL" as TipoRequisito, sistema: "", requisito: "", fuente: "", apartado: "", comoSeCumple: "", documentos: "", areaId: "", responsableId: "", fechaVigor: "", vigenciaConfirmada: "" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const limpio = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      await apiClient.post("/requisitos", limpio);
      onCreado();
    } catch {
      setError("No se pudo crear el requisito. Verificá los datos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tipo">
          <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoRequisito })}>
            {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
          </select>
        </FormField>
        <FormField label="Sistema">
          <input className={inputClass} placeholder="Inocuidad, Calidad, Ambiental, SST, Cliente" value={form.sistema} onChange={(e) => setForm({ ...form, sistema: e.target.value })} />
        </FormField>
      </div>
      <FormField label="Requisito (norma, ley, cláusula o requisito del cliente)">
        <textarea required className={inputClass} value={form.requisito} onChange={(e) => setForm({ ...form, requisito: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fuente (autoridad / cliente)">
          <input className={inputClass} value={form.fuente} onChange={(e) => setForm({ ...form, fuente: e.target.value })} />
        </FormField>
        <FormField label="Apartado aplicable">
          <input className={inputClass} value={form.apartado} onChange={(e) => setForm({ ...form, apartado: e.target.value })} />
        </FormField>
      </div>
      <FormField label="Cómo se cumple">
        <textarea className={inputClass} value={form.comoSeCumple} onChange={(e) => setForm({ ...form, comoSeCumple: e.target.value })} />
      </FormField>
      <FormField label="Documentos del sistema que lo cubren">
        <input className={inputClass} placeholder="Ej: PR-FS-01 · PR-QC-04" value={form.documentos} onChange={(e) => setForm({ ...form, documentos: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Área">
          <select className={inputClass} value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}>
            <option value="">Sin asignar</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Responsable (dueño técnico)">
          <select className={inputClass} value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
            <option value="">Sin asignar</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="En vigor desde">
          <input type="date" className={inputClass} value={form.fechaVigor} onChange={(e) => setForm({ ...form, fechaVigor: e.target.value })} />
        </FormField>
        <FormField label="Vigencia confirmada (fecha, fuente)">
          <input className={inputClass} value={form.vigenciaConfirmada} onChange={(e) => setForm({ ...form, vigenciaConfirmada: e.target.value })} />
        </FormField>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">Cancelar</button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">{enviando ? "Guardando..." : "Crear requisito"}</button>
      </div>
    </form>
  );
}

function DetalleRequisito({ requisitoId, onCerrar, onCambio }: { requisitoId: string; onCerrar: () => void; onCambio: () => void }) {
  const [r, setR] = useState<Requisito | null>(null);
  const [evaluacion, setEvaluacion] = useState({ estado: "CUMPLE" as EstadoCumplimientoRequisito, evidencia: "", proximaEvaluacion: "" });
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function recargar() {
    apiClient.get<Requisito>(`/requisitos/${requisitoId}`).then((res) => {
      setR(res.data);
      setEvaluacion({ estado: res.data.estado === "POR_EVALUAR" ? "CUMPLE" : res.data.estado, evidencia: res.data.evidencia ?? "", proximaEvaluacion: res.data.proximaEvaluacion?.slice(0, 10) ?? "" });
    });
  }
  useEffect(recargar, [requisitoId]);

  async function evaluar(e: React.FormEvent) {
    e.preventDefault();
    setProcesando(true);
    setError(null);
    try {
      await apiClient.post(`/requisitos/${requisitoId}/evaluar`, { estado: evaluacion.estado, evidencia: evaluacion.evidencia || undefined, proximaEvaluacion: evaluacion.proximaEvaluacion || undefined });
      recargar();
      onCambio();
    } catch {
      setError("No se pudo registrar la evaluación.");
    } finally {
      setProcesando(false);
    }
  }

  if (!r) return <p className="text-sm text-slate-400">Cargando...</p>;
  const cambio = /CAMBIO|CANCELADA/i.test(r.vigenciaConfirmada ?? "");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{TIPO_LABEL[r.tipo]} · {r.sistema ?? "—"} · {r.fuente ?? ""}</p>
          <h4 className="text-base font-semibold text-slate-800">{r.requisito}</h4>
        </div>
        <Badge color={ESTADO[r.estado].color}>{ESTADO[r.estado].etiqueta}</Badge>
      </div>
      {cambio && <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">⚠ Cambio normativo detectado: {r.vigenciaConfirmada}</div>}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-slate-400">Apartado</dt><dd className="text-slate-700">{r.apartado ?? "—"}</dd></div>
        <div><dt className="text-slate-400">En vigor desde</dt><dd className="text-slate-700">{fecha(r.fechaVigor)}</dd></div>
        <div className="col-span-2"><dt className="text-slate-400">Cómo se cumple</dt><dd className="text-slate-700">{r.comoSeCumple ?? "—"}</dd></div>
        <div className="col-span-2"><dt className="text-slate-400">Documentos del sistema</dt><dd className="text-slate-700">{r.documentos ?? "—"}</dd></div>
        <div><dt className="text-slate-400">Área</dt><dd className="text-slate-700">{r.area?.nombre ?? "—"}</dd></div>
        <div><dt className="text-slate-400">Responsable</dt><dd className="text-slate-700">{r.responsable?.nombre ?? "—"}</dd></div>
        {!cambio && <div className="col-span-2"><dt className="text-slate-400">Vigencia confirmada</dt><dd className="text-slate-700">{r.vigenciaConfirmada ?? "—"}</dd></div>}
        <div><dt className="text-slate-400">Evidencia de cumplimiento</dt><dd className="text-slate-700">{r.evidencia ?? "—"}</dd></div>
        <div><dt className="text-slate-400">Próxima evaluación</dt><dd className="text-slate-700">{fecha(r.proximaEvaluacion)}</dd></div>
      </dl>

      <form onSubmit={evaluar} className="space-y-2 rounded-md border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700">Registrar evaluación de cumplimiento (9.1.2)</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Resultado">
            <select className={inputClass} value={evaluacion.estado} onChange={(e) => setEvaluacion({ ...evaluacion, estado: e.target.value as EstadoCumplimientoRequisito })}>
              {ESTADOS.filter((e) => e.valor !== "POR_EVALUAR").map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
            </select>
          </FormField>
          <FormField label="Próxima evaluación (vacío = 12 meses)">
            <input type="date" className={inputClass} value={evaluacion.proximaEvaluacion} onChange={(e) => setEvaluacion({ ...evaluacion, proximaEvaluacion: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Evidencia">
          <input className={inputClass} placeholder="Registro, permiso, análisis, auditoría..." value={evaluacion.evidencia} onChange={(e) => setEvaluacion({ ...evaluacion, evidencia: e.target.value })} />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">Cerrar</button>
          <button type="submit" disabled={procesando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">Guardar evaluación</button>
        </div>
      </form>
    </div>
  );
}

export function RequisitosPage() {
  const [areas, setAreas] = useState<RefNombre[]>([]);
  const [usuarios, setUsuarios] = useState<RefNombre[]>([]);
  const [resumen, setResumen] = useState<ResumenRequisitos | null>(null);
  const [filtros, setFiltros] = useState({ tipo: "", estado: "", areaId: "", q: "" });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const { items, pagination, setPage, cargando, recargar } = usePaginatedList<Requisito>("/requisitos", filtros);

  function cargarResumen() {
    apiClient.get<ResumenRequisitos>("/requisitos/resumen").then((res) => setResumen(res.data));
  }
  useEffect(() => {
    apiClient.get<RefNombre[]>("/areas").then((res) => setAreas(res.data)).catch(() => setAreas([]));
    apiClient.get<RefNombre[]>("/usuarios").then((res) => setUsuarios(res.data)).catch(() => setUsuarios([]));
    cargarResumen();
  }, []);

  const columnas: Columna<Requisito>[] = [
    { encabezado: "Tipo", render: (r) => TIPO_LABEL[r.tipo] },
    { encabezado: "Sistema", render: (r) => r.sistema ?? "—" },
    { encabezado: "Requisito", render: (r) => <span title={r.requisito}>{r.requisito.length > 110 ? r.requisito.slice(0, 110) + "…" : r.requisito}</span> },
    { encabezado: "Documentos", render: (r) => r.documentos ?? "—" },
    { encabezado: "Responsable", render: (r) => r.responsable?.nombre ?? "—" },
    { encabezado: "Vigencia", render: (r) => (/CAMBIO|CANCELADA/i.test(r.vigenciaConfirmada ?? "") ? <Badge color="rojo">Cambio</Badge> : /confirmado/i.test(r.vigenciaConfirmada ?? "") ? <Badge color="verde">Confirmada</Badge> : <Badge color="gris">Por confirmar</Badge>) },
    { encabezado: "Cumplimiento", render: (r) => <Badge color={ESTADO[r.estado].color}>{ESTADO[r.estado].etiqueta}</Badge> },
    { encabezado: "", render: (r) => <button onClick={() => setSeleccionado(r.id)} className="text-sm font-medium text-brand-600 hover:underline">Ver</button> },
  ];

  const total = resumen ? Object.values(resumen.porEstado).reduce((a, b) => a + (b ?? 0), 0) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Requisitos legales, de esquema y de cliente</h1>
          <p className="text-sm text-slate-400">Matriz PR-IMS-02-F01 · identificación, vigencia y evaluación de cumplimiento (6.1.3 / 9.1.2).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => descargarArchivo("/requisitos/export", filtros, "PR-IMS-02-F01.xlsx")} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Exportar a Excel</button>
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">+ Nuevo requisito</button>
        </div>
      </div>

      {resumen && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard titulo="Requisitos" valor={total} subtitulo={`Legal ${resumen.porTipo.LEGAL ?? 0} · Esquema ${resumen.porTipo.ESQUEMA ?? 0} · Cliente ${resumen.porTipo.CLIENTE ?? 0}`} />
          <StatCard titulo="Por evaluar" valor={resumen.porEstado.POR_EVALUAR ?? 0} color="amarillo" />
          <StatCard titulo="Cumple" valor={resumen.porEstado.CUMPLE ?? 0} color="verde" />
          <StatCard titulo="Parcial" valor={resumen.porEstado.PARCIAL ?? 0} color="azul" />
          <StatCard titulo="No cumple" valor={resumen.porEstado.NO_CUMPLE ?? 0} color="rojo" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input className={`${inputClass} w-64`} placeholder="Buscar norma, fuente o documento..." value={filtros.q} onChange={(e) => setFiltros({ ...filtros, q: e.target.value })} />
        <select className={`${inputClass} w-auto`} value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
        </select>
        <select className={`${inputClass} w-auto`} value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
        </select>
        <select className={`${inputClass} w-auto`} value={filtros.areaId} onChange={(e) => setFiltros({ ...filtros, areaId: e.target.value })}>
          <option value="">Todas las áreas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>

      {cargando ? <p className="text-sm text-slate-400">Cargando requisitos...</p> : (
        <>
          <DataTable columnas={columnas} filas={items} vacio="No hay requisitos registrados." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nuevo requisito" onClose={() => setMostrarForm(false)}>
          <NuevoRequisitoForm areas={areas} usuarios={usuarios} onCreado={() => { setMostrarForm(false); recargar(); cargarResumen(); }} onCancelar={() => setMostrarForm(false)} />
        </Modal>
      )}
      {seleccionado && (
        <Modal titulo="Requisito" onClose={() => setSeleccionado(null)}>
          <DetalleRequisito requisitoId={seleccionado} onCerrar={() => setSeleccionado(null)} onCambio={() => { recargar(); cargarResumen(); }} />
        </Modal>
      )}
    </div>
  );
}
