import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { descargarArchivo } from "@/lib/descargas";
import type { Indicador, RefNombre, SemaforoIndicador, Usuario } from "@/types";

const SEMAFORO_COLOR: Record<SemaforoIndicador, "verde" | "amarillo" | "rojo"> = {
  VERDE: "verde",
  AMARILLO: "amarillo",
  ROJO: "rojo",
};

function NuevoIndicadorForm({
  procesos,
  usuarios,
  onCreado,
  onCancelar,
}: {
  procesos: RefNombre[];
  usuarios: Usuario[];
  onCreado: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({
    nombre: "",
    frecuencia: "MENSUAL",
    meta: "",
    unidad: "",
    direccion: "MAYOR_ES_MEJOR",
    procesoId: "",
    responsableId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/indicadores", {
        ...form,
        meta: Number(form.meta),
        procesoId: form.procesoId || undefined,
      });
      onCreado();
    } catch {
      setError("No se pudo crear el indicador. Verifica los datos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Nombre">
        <input required className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Frecuencia">
          <select className={inputClass} value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}>
            {["DIARIA", "SEMANAL", "MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Dirección">
          <select className={inputClass} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}>
            <option value="MAYOR_ES_MEJOR">Mayor es mejor</option>
            <option value="MENOR_ES_MEJOR">Menor es mejor</option>
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Meta">
          <input required type="number" step="any" className={inputClass} value={form.meta} onChange={(e) => setForm({ ...form, meta: e.target.value })} />
        </FormField>
        <FormField label="Unidad (opcional)">
          <input className={inputClass} placeholder="%, pzas, días..." value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} />
        </FormField>
      </div>
      <FormField label="Proceso (opcional)">
        <select className={inputClass} value={form.procesoId} onChange={(e) => setForm({ ...form, procesoId: e.target.value })}>
          <option value="">Sin asignar</option>
          {procesos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Responsable">
        <select required className={inputClass} value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
          <option value="">Selecciona...</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {enviando ? "Creando..." : "Crear indicador"}
        </button>
      </div>
    </form>
  );
}

function CapturarValorForm({ indicadorId, onCreado }: { indicadorId: string; onCreado: () => void }) {
  const [form, setForm] = useState({ valor: "", fecha: new Date().toISOString().slice(0, 10), observaciones: "" });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post(`/indicadores/${indicadorId}/registros`, { ...form, valor: Number(form.valor) });
      setForm({ valor: "", fecha: new Date().toISOString().slice(0, 10), observaciones: "" });
      onCreado();
    } catch {
      setError("No se pudo registrar el valor (¿ya existe una captura para esa fecha?).");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-md border border-slate-200 p-3">
      <FormField label="Fecha">
        <input type="date" required className={inputClass} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
      </FormField>
      <FormField label="Valor">
        <input type="number" step="any" required className={inputClass} value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
      </FormField>
      <FormField label="Observaciones">
        <input className={inputClass} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
      </FormField>
      <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
        Capturar
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}

function DetalleIndicador({ indicadorId, onCerrar }: { indicadorId: string; onCerrar: () => void }) {
  const [indicador, setIndicador] = useState<Indicador | null>(null);

  function recargar() {
    apiClient.get<Indicador>(`/indicadores/${indicadorId}`).then((res) => setIndicador(res.data));
  }

  useEffect(recargar, [indicadorId]);

  if (!indicador) return <p className="text-sm text-slate-400">Cargando...</p>;

  const datos = (indicador.registros ?? []).map((r) => ({
    fecha: new Date(r.fecha).toLocaleDateString(),
    valor: r.valor,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-800">{indicador.nombre}</h4>
          <p className="text-xs text-slate-400">Meta: {indicador.meta} {indicador.unidad} · {indicador.direccion === "MAYOR_ES_MEJOR" ? "mayor es mejor" : "menor es mejor"}</p>
        </div>
        {indicador.semaforo && <Badge color={SEMAFORO_COLOR[indicador.semaforo]}>{indicador.semaforo}</Badge>}
      </div>

      {datos.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <ReferenceLine y={indicador.meta} stroke="#94a3b8" strokeDasharray="4 4" label="Meta" />
            <Line type="monotone" dataKey="valor" stroke="#3b6fed" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-slate-400">Sin capturas aún.</p>
      )}

      <CapturarValorForm indicadorId={indicadorId} onCreado={recargar} />

      <div className="flex justify-end">
        <button onClick={onCerrar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function IndicadoresPage() {
  const [procesos, setProcesos] = useState<RefNombre[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const {
    items: indicadores,
    pagination,
    setPage,
    cargando,
    recargar: recargarLista,
  } = usePaginatedList<Indicador>("/indicadores", {});

  useEffect(() => {
    apiClient.get<RefNombre[]>("/procesos").then((res) => setProcesos(res.data));
    apiClient.get<Usuario[]>("/usuarios").then((res) => setUsuarios(res.data));
  }, []);

  const columnas: Columna<Indicador>[] = [
    { encabezado: "Nombre", render: (i) => i.nombre },
    { encabezado: "Frecuencia", render: (i) => i.frecuencia },
    { encabezado: "Meta", render: (i) => `${i.meta} ${i.unidad ?? ""}` },
    { encabezado: "Último valor", render: (i) => (i.ultimoValor != null ? i.ultimoValor : "—") },
    {
      encabezado: "Semáforo",
      render: (i) => (i.semaforo ? <Badge color={SEMAFORO_COLOR[i.semaforo]}>{i.semaforo}</Badge> : <Badge color="gris">SIN DATOS</Badge>),
    },
    {
      encabezado: "",
      render: (i) => (
        <button onClick={() => setSeleccionado(i.id)} className="text-sm font-medium text-brand-600 hover:underline">
          Ver / capturar
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Indicadores (KPI)</h1>
        <div className="flex gap-2">
          <button
            onClick={() => descargarArchivo("/indicadores/export", {}, "indicadores.xlsx")}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Exportar a Excel
          </button>
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Nuevo indicador
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando indicadores...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={indicadores} vacio="No hay indicadores registrados." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nuevo indicador" onClose={() => setMostrarForm(false)}>
          <NuevoIndicadorForm
            procesos={procesos}
            usuarios={usuarios}
            onCreado={() => {
              setMostrarForm(false);
              recargarLista();
            }}
            onCancelar={() => setMostrarForm(false)}
          />
        </Modal>
      )}

      {seleccionado && (
        <Modal titulo="Detalle del indicador" onClose={() => setSeleccionado(null)}>
          <DetalleIndicador indicadorId={seleccionado} onCerrar={() => setSeleccionado(null)} />
        </Modal>
      )}
    </div>
  );
}
