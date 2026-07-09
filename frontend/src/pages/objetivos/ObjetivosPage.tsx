import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import type { Actividad, Area, EstadoObjetivo, Objetivo, Plan, Usuario } from "@/types";

const ESTADO_COLOR = {
  PLANEADO: "gris",
  EN_PROCESO: "azul",
  LOGRADO: "verde",
  NO_LOGRADO: "rojo",
  CANCELADO: "gris",
} as const satisfies Record<EstadoObjetivo, "gris" | "azul" | "verde" | "rojo" | "amarillo">;

function NuevoObjetivoForm({
  areas,
  usuarios,
  onCreado,
  onCancelar,
}: {
  areas: Area[];
  usuarios: Usuario[];
  onCreado: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    tipo: "OPERATIVO",
    areaId: "",
    responsableId: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/objetivos", form);
      onCreado();
    } catch {
      setError("No se pudo crear el objetivo. Verifica los datos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Nombre">
        <input required className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      </FormField>
      <FormField label="Descripción">
        <textarea className={inputClass} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </FormField>
      <FormField label="Tipo">
        <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          <option value="OPERATIVO">Operativo</option>
          <option value="ESTRATEGICO">Estratégico</option>
        </select>
      </FormField>
      <FormField label="Área">
        <select required className={inputClass} value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}>
          <option value="">Selecciona...</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
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
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha inicio">
          <input type="date" required className={inputClass} value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
        </FormField>
        <FormField label="Fecha fin">
          <input type="date" required className={inputClass} value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
        </FormField>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {enviando ? "Creando..." : "Crear objetivo"}
        </button>
      </div>
    </form>
  );
}

function NuevoPlanForm({ objetivoId, usuarios, onCreado }: { objetivoId: string; usuarios: Usuario[]; onCreado: () => void }) {
  const [form, setForm] = useState({ nombre: "", responsableId: "", fechaInicio: "", fechaFin: "" });
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post("/planes", { ...form, objetivoId });
    setForm({ nombre: "", responsableId: "", fechaInicio: "", fechaFin: "" });
    setMostrar(false);
    onCreado();
  }

  if (!mostrar) {
    return (
      <button onClick={() => setMostrar(true)} className="text-sm font-medium text-brand-600 hover:underline">
        + Agregar plan
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 p-3">
      <input required placeholder="Nombre del plan" className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <select required className={inputClass} value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
        <option value="">Responsable...</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>{u.nombre}</option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" required className={inputClass} value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
        <input type="date" required className={inputClass} value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setMostrar(false)} className="text-sm text-slate-500">Cancelar</button>
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white">Guardar</button>
      </div>
    </form>
  );
}

function NuevaActividadForm({ planId, usuarios, onCreado }: { planId: string; usuarios: Usuario[]; onCreado: () => void }) {
  const [form, setForm] = useState({ nombre: "", responsableId: "", fechaInicio: "", fechaFin: "" });
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post("/actividades", { ...form, planId });
    setForm({ nombre: "", responsableId: "", fechaInicio: "", fechaFin: "" });
    setMostrar(false);
    onCreado();
  }

  if (!mostrar) {
    return (
      <button onClick={() => setMostrar(true)} className="text-xs font-medium text-brand-600 hover:underline">
        + Agregar actividad
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md bg-slate-50 p-2">
      <input required placeholder="Nombre de la actividad" className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <select required className={inputClass} value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
        <option value="">Responsable...</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>{u.nombre}</option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" required className={inputClass} value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
        <input type="date" required className={inputClass} value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setMostrar(false)} className="text-xs text-slate-500">Cancelar</button>
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white">Guardar</button>
      </div>
    </form>
  );
}

function ActividadRow({ actividad, onCambio }: { actividad: Actividad; onCambio: () => void }) {
  async function actualizarAvance(avancePorcentaje: number) {
    const estado = avancePorcentaje >= 100 ? "COMPLETADA" : "EN_PROCESO";
    await apiClient.put(`/actividades/${actividad.id}`, { avancePorcentaje, estado });
    onCambio();
  }

  return (
    <li className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-slate-700">{actividad.nombre}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={actividad.avancePorcentaje}
          onChange={(e) => actualizarAvance(Number(e.target.value))}
          className="w-24"
        />
        <span className="w-10 text-xs text-slate-400">{actividad.avancePorcentaje}%</span>
      </div>
    </li>
  );
}

function DetalleObjetivo({ objetivoId, usuarios, onCerrar }: { objetivoId: string; usuarios: Usuario[]; onCerrar: () => void }) {
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);

  function recargar() {
    apiClient.get<Objetivo>(`/objetivos/${objetivoId}`).then((res) => setObjetivo(res.data));
  }

  useEffect(recargar, [objetivoId]);

  if (!objetivo) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-slate-800">{objetivo.nombre}</h4>
        <p className="text-sm text-slate-500">{objetivo.descripcion}</p>
      </div>

      <div className="space-y-3">
        {(objetivo.planes ?? []).map((plan: Plan) => (
          <div key={plan.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">{plan.nombre}</p>
              <Badge color="azul">{plan.estado}</Badge>
            </div>
            <ul className="mt-2 divide-y divide-slate-100">
              {(plan.actividades ?? []).map((act) => (
                <ActividadRow key={act.id} actividad={act} onCambio={recargar} />
              ))}
            </ul>
            <div className="mt-2">
              <NuevaActividadForm planId={plan.id} usuarios={usuarios} onCreado={recargar} />
            </div>
          </div>
        ))}
        <NuevoPlanForm objetivoId={objetivoId} usuarios={usuarios} onCreado={recargar} />
      </div>

      <div className="flex justify-end">
        <button onClick={onCerrar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function ObjetivosPage() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  function recargarLista() {
    setCargando(true);
    apiClient.get<Objetivo[]>("/objetivos").then((res) => setObjetivos(res.data)).finally(() => setCargando(false));
  }

  useEffect(() => {
    recargarLista();
    apiClient.get<Area[]>("/areas").then((res) => setAreas(res.data));
    apiClient.get<Usuario[]>("/usuarios").then((res) => setUsuarios(res.data));
  }, []);

  const columnas: Columna<Objetivo>[] = [
    { encabezado: "Nombre", render: (o) => o.nombre },
    { encabezado: "Tipo", render: (o) => o.tipo },
    { encabezado: "Área", render: (o) => o.area?.nombre ?? "—" },
    { encabezado: "Responsable", render: (o) => o.responsable?.nombre ?? "—" },
    { encabezado: "Estado", render: (o) => <Badge color={ESTADO_COLOR[o.estado]}>{o.estado}</Badge> },
    {
      encabezado: "",
      render: (o) => (
        <button onClick={() => setSeleccionado(o.id)} className="text-sm font-medium text-brand-600 hover:underline">
          Ver planes
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Objetivos y Planes</h1>
        <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          + Nuevo objetivo
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando objetivos...</p>
      ) : (
        <DataTable columnas={columnas} filas={objetivos} vacio="No hay objetivos registrados." />
      )}

      {mostrarForm && (
        <Modal titulo="Nuevo objetivo" onClose={() => setMostrarForm(false)}>
          <NuevoObjetivoForm
            areas={areas}
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
        <Modal titulo="Planes y actividades" onClose={() => setSeleccionado(null)}>
          <DetalleObjetivo objetivoId={seleccionado} usuarios={usuarios} onCerrar={() => setSeleccionado(null)} />
        </Modal>
      )}
    </div>
  );
}
