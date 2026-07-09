import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { calcularNivelRiesgo } from "@/lib/riesgo";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { descargarArchivo } from "@/lib/descargas";
import type { NivelRiesgo, RefNombre, Riesgo, Usuario } from "@/types";

const NIVEL_COLOR: Record<NivelRiesgo, "verde" | "amarillo" | "rojo"> = {
  BAJO: "verde",
  MODERADO: "amarillo",
  ALTO: "rojo",
  CRITICO: "rojo",
};

function useCatalogosRiesgo() {
  const [procesos, setProcesos] = useState<RefNombre[]>([]);
  const [categorias, setCategorias] = useState<RefNombre[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    apiClient.get<RefNombre[]>("/procesos").then((res) => setProcesos(res.data));
    apiClient.get<RefNombre[]>("/categorias-riesgo").then((res) => setCategorias(res.data));
    apiClient.get<Usuario[]>("/usuarios").then((res) => setUsuarios(res.data));
  }, []);

  return { procesos, categorias, usuarios };
}

function NuevoRiesgoForm({
  procesos,
  categorias,
  usuarios,
  onCreado,
  onCancelar,
}: {
  procesos: RefNombre[];
  categorias: RefNombre[];
  usuarios: Usuario[];
  onCreado: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({
    codigo: "",
    descripcion: "",
    procesoId: "",
    categoriaId: "",
    probabilidad: 3,
    impacto: 3,
    controlesExistentes: "",
    responsableId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const preview = calcularNivelRiesgo(form.probabilidad, form.impacto);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/riesgos", form);
      onCreado();
    } catch {
      setError("No se pudo crear el riesgo. Verifica los datos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Código">
        <input required className={inputClass} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
      </FormField>
      <FormField label="Descripción">
        <textarea required className={inputClass} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </FormField>
      <FormField label="Proceso">
        <select required className={inputClass} value={form.procesoId} onChange={(e) => setForm({ ...form, procesoId: e.target.value })}>
          <option value="">Selecciona...</option>
          {procesos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Categoría">
        <select required className={inputClass} value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
          <option value="">Selecciona...</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={`Probabilidad (${form.probabilidad})`}>
          <input
            type="range"
            min={1}
            max={5}
            value={form.probabilidad}
            onChange={(e) => setForm({ ...form, probabilidad: Number(e.target.value) })}
            className="w-full"
          />
        </FormField>
        <FormField label={`Impacto (${form.impacto})`}>
          <input
            type="range"
            min={1}
            max={5}
            value={form.impacto}
            onChange={(e) => setForm({ ...form, impacto: Number(e.target.value) })}
            className="w-full"
          />
        </FormField>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-500">Nivel resultante:</span>
        <Badge color={NIVEL_COLOR[preview.nivel]}>{preview.nivel}</Badge>
        <span className="text-slate-400">(puntaje {preview.puntaje})</span>
      </div>

      <FormField label="Controles existentes (opcional)">
        <textarea className={inputClass} value={form.controlesExistentes} onChange={(e) => setForm({ ...form, controlesExistentes: e.target.value })} />
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
          {enviando ? "Creando..." : "Crear riesgo"}
        </button>
      </div>
    </form>
  );
}

function NuevoTratamientoForm({ riesgoId, usuarios, onCreado }: { riesgoId: string; usuarios: Usuario[]; onCreado: () => void }) {
  const [form, setForm] = useState({ descripcion: "", responsableId: "", fechaCompromiso: "" });
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/riesgos/${riesgoId}/tratamientos`, form);
    setForm({ descripcion: "", responsableId: "", fechaCompromiso: "" });
    setMostrar(false);
    onCreado();
  }

  if (!mostrar) {
    return (
      <button onClick={() => setMostrar(true)} className="text-sm font-medium text-brand-600 hover:underline">
        + Agregar plan de tratamiento
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 p-3">
      <textarea required placeholder="Descripción del tratamiento" className={inputClass} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      <select required className={inputClass} value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
        <option value="">Responsable...</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>{u.nombre}</option>
        ))}
      </select>
      <input type="date" required className={inputClass} value={form.fechaCompromiso} onChange={(e) => setForm({ ...form, fechaCompromiso: e.target.value })} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setMostrar(false)} className="text-sm text-slate-500">Cancelar</button>
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white">Guardar</button>
      </div>
    </form>
  );
}

function DetalleRiesgo({ riesgoId, usuarios, onCerrar }: { riesgoId: string; usuarios: Usuario[]; onCerrar: () => void }) {
  const [riesgo, setRiesgo] = useState<Riesgo | null>(null);

  function recargar() {
    apiClient.get<Riesgo>(`/riesgos/${riesgoId}`).then((res) => setRiesgo(res.data));
  }

  useEffect(recargar, [riesgoId]);

  async function actualizarEstadoTratamiento(tratamientoId: string, estado: string) {
    await apiClient.put(`/riesgos/${riesgoId}/tratamientos/${tratamientoId}`, { estado });
    recargar();
  }

  if (!riesgo) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">{riesgo.codigo}</p>
          <h4 className="text-base font-semibold text-slate-800">{riesgo.descripcion}</h4>
        </div>
        <Badge color={NIVEL_COLOR[riesgo.nivelRiesgo]}>{riesgo.nivelRiesgo} ({riesgo.puntajeRiesgo})</Badge>
      </div>

      <div>
        <h5 className="mb-2 text-sm font-semibold text-slate-600">Planes de tratamiento</h5>
        <ul className="space-y-2">
          {(riesgo.planesTratamiento ?? []).map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 text-sm">
              <div>
                <p className="text-slate-700">{t.descripcion}</p>
                <p className="text-xs text-slate-400">{t.responsable?.nombre} · vence {new Date(t.fechaCompromiso).toLocaleDateString()}</p>
              </div>
              <select
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                value={t.estado}
                onChange={(e) => actualizarEstadoTratamiento(t.id, e.target.value)}
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="IMPLEMENTADO">Implementado</option>
                <option value="VERIFICADO">Verificado</option>
              </select>
            </li>
          ))}
          {(riesgo.planesTratamiento ?? []).length === 0 && (
            <p className="text-sm text-slate-400">Sin planes de tratamiento aún.</p>
          )}
        </ul>
        <div className="mt-2">
          <NuevoTratamientoForm riesgoId={riesgoId} usuarios={usuarios} onCreado={recargar} />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onCerrar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function RiesgosPage() {
  const { procesos, categorias, usuarios } = useCatalogosRiesgo();
  const [filtros, setFiltros] = useState({ nivelRiesgo: "", estado: "" });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const {
    items: riesgos,
    pagination,
    setPage,
    cargando,
    recargar: recargarLista,
  } = usePaginatedList<Riesgo>("/riesgos", filtros);

  const columnas: Columna<Riesgo>[] = [
    { encabezado: "Código", render: (r) => r.codigo },
    { encabezado: "Descripción", render: (r) => r.descripcion },
    { encabezado: "Proceso", render: (r) => r.proceso?.nombre ?? "—" },
    { encabezado: "P × I", render: (r) => `${r.probabilidad} × ${r.impacto} = ${r.puntajeRiesgo}` },
    { encabezado: "Nivel", render: (r) => <Badge color={NIVEL_COLOR[r.nivelRiesgo]}>{r.nivelRiesgo}</Badge> },
    { encabezado: "Estado", render: (r) => r.estado },
    {
      encabezado: "",
      render: (r) => (
        <button onClick={() => setSeleccionado(r.id)} className="text-sm font-medium text-brand-600 hover:underline">
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Matriz de Riesgos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => descargarArchivo("/riesgos/export", filtros, "riesgos.xlsx")}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Exportar a Excel
          </button>
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Nuevo riesgo
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={`${inputClass} w-auto`} value={filtros.nivelRiesgo} onChange={(e) => setFiltros({ ...filtros, nivelRiesgo: e.target.value })}>
          <option value="">Todos los niveles</option>
          {(["BAJO", "MODERADO", "ALTO", "CRITICO"] as const).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select className={`${inputClass} w-auto`} value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {(["IDENTIFICADO", "EN_TRATAMIENTO", "MITIGADO", "CERRADO"] as const).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando riesgos...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={riesgos} vacio="No hay riesgos registrados." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nuevo riesgo" onClose={() => setMostrarForm(false)}>
          <NuevoRiesgoForm
            procesos={procesos}
            categorias={categorias}
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
        <Modal titulo="Detalle del riesgo" onClose={() => setSeleccionado(null)}>
          <DetalleRiesgo riesgoId={seleccionado} usuarios={usuarios} onCerrar={() => setSeleccionado(null)} />
        </Modal>
      )}
    </div>
  );
}
