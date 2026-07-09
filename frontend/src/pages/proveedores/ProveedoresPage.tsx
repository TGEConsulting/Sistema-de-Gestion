import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { FileUpload } from "@/components/common/FileUpload";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import type { EstadoProveedor, Proveedor } from "@/types";

const ESTADO_COLOR: Record<EstadoProveedor, "gris" | "verde" | "amarillo" | "rojo"> = {
  EN_EVALUACION: "amarillo",
  ACTIVO: "verde",
  SUSPENDIDO: "rojo",
  INACTIVO: "gris",
};

function NuevoProveedorForm({ onCreado, onCancelar }: { onCreado: () => void; onCancelar: () => void }) {
  const [form, setForm] = useState({ nombre: "", taxId: "", tipo: "INSUMOS", contacto: "", email: "", telefono: "" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/proveedores", form);
      onCreado();
    } catch {
      setError("No se pudo crear el proveedor. Verifica los datos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Nombre">
        <input required className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      </FormField>
      <FormField label="Tipo">
        <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          {["INSUMOS", "SERVICIOS", "TRANSPORTE", "MAQUINARIA", "OTRO"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>
      <FormField label="RFC / Tax ID (opcional)">
        <input className={inputClass} value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
      </FormField>
      <FormField label="Contacto (opcional)">
        <input className={inputClass} value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email (opcional)">
          <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Teléfono (opcional)">
          <input className={inputClass} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </FormField>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {enviando ? "Creando..." : "Crear proveedor"}
        </button>
      </div>
    </form>
  );
}

function NuevaEvaluacionForm({ proveedorId, onCreado }: { proveedorId: string; onCreado: () => void }) {
  const [form, setForm] = useState({ puntuacion: "", resultado: "" });
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/proveedores/${proveedorId}/evaluaciones`, { ...form, puntuacion: Number(form.puntuacion) });
    setForm({ puntuacion: "", resultado: "" });
    setMostrar(false);
    onCreado();
  }

  if (!mostrar) {
    return (
      <button onClick={() => setMostrar(true)} className="text-sm font-medium text-brand-600 hover:underline">
        + Registrar evaluación
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 p-3">
      <FormField label="Puntuación (0-100)">
        <input type="number" min={0} max={100} required className={inputClass} value={form.puntuacion} onChange={(e) => setForm({ ...form, puntuacion: e.target.value })} />
      </FormField>
      <FormField label="Resultado / comentarios">
        <textarea className={inputClass} value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} />
      </FormField>
      <p className="text-xs text-slate-400">≥70 pasa a ACTIVO · 50-69 queda EN_EVALUACION · &lt;50 pasa a SUSPENDIDO.</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setMostrar(false)} className="text-sm text-slate-500">Cancelar</button>
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white">Guardar</button>
      </div>
    </form>
  );
}

function NuevoDocumentoForm({ proveedorId, onCreado }: { proveedorId: string; onCreado: () => void }) {
  const [form, setForm] = useState<{ nombre: string; fechaVencimiento: string; archivoUrl?: string }>({
    nombre: "",
    fechaVencimiento: "",
  });
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/proveedores/${proveedorId}/documentos`, {
      ...form,
      fechaVencimiento: form.fechaVencimiento || undefined,
    });
    setForm({ nombre: "", fechaVencimiento: "" });
    setMostrar(false);
    onCreado();
  }

  if (!mostrar) {
    return (
      <button onClick={() => setMostrar(true)} className="text-sm font-medium text-brand-600 hover:underline">
        + Agregar documento
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 p-3">
      <input required placeholder="Nombre del documento" className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <FormField label="Fecha de vencimiento (opcional)">
        <input type="date" className={inputClass} value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} />
      </FormField>
      <FormField label="Archivo (opcional)">
        <FileUpload value={form.archivoUrl} onChange={(archivoUrl) => setForm({ ...form, archivoUrl })} />
      </FormField>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setMostrar(false)} className="text-sm text-slate-500">Cancelar</button>
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white">Guardar</button>
      </div>
    </form>
  );
}

function DetalleProveedor({ proveedorId, onCerrar }: { proveedorId: string; onCerrar: () => void }) {
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);

  function recargar() {
    apiClient.get<Proveedor>(`/proveedores/${proveedorId}`).then((res) => setProveedor(res.data));
  }

  useEffect(recargar, [proveedorId]);

  if (!proveedor) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-800">{proveedor.nombre}</h4>
          <p className="text-xs text-slate-400">{proveedor.tipo} · {proveedor.email ?? "sin email"}</p>
        </div>
        <Badge color={ESTADO_COLOR[proveedor.estado]}>{proveedor.estado}</Badge>
      </div>

      <div>
        <h5 className="mb-2 text-sm font-semibold text-slate-600">Evaluaciones</h5>
        <ul className="space-y-1">
          {(proveedor.evaluaciones ?? []).map((ev) => (
            <li key={ev.id} className="rounded-md border border-slate-200 p-2 text-sm">
              <span className="font-medium text-slate-700">{ev.puntuacion} pts</span>
              <span className="ml-2 text-xs text-slate-400">{new Date(ev.fecha).toLocaleDateString()}</span>
              {ev.resultado && <p className="text-xs text-slate-500">{ev.resultado}</p>}
            </li>
          ))}
          {(proveedor.evaluaciones ?? []).length === 0 && <p className="text-sm text-slate-400">Sin evaluaciones aún.</p>}
        </ul>
        <div className="mt-2">
          <NuevaEvaluacionForm proveedorId={proveedorId} onCreado={recargar} />
        </div>
      </div>

      <div>
        <h5 className="mb-2 text-sm font-semibold text-slate-600">Documentos</h5>
        <ul className="space-y-1">
          {(proveedor.documentos ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 text-sm">
              <span className="text-slate-700">{d.nombre}</span>
              {d.fechaVencimiento && <span className="text-xs text-slate-400">vence {new Date(d.fechaVencimiento).toLocaleDateString()}</span>}
            </li>
          ))}
          {(proveedor.documentos ?? []).length === 0 && <p className="text-sm text-slate-400">Sin documentos aún.</p>}
        </ul>
        <div className="mt-2">
          <NuevoDocumentoForm proveedorId={proveedorId} onCreado={recargar} />
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

export function ProveedoresPage() {
  const [filtros, setFiltros] = useState({ tipo: "", estado: "", q: "" });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const {
    items: proveedores,
    pagination,
    setPage,
    cargando,
    recargar: recargarLista,
  } = usePaginatedList<Proveedor>("/proveedores", filtros);

  const columnas: Columna<Proveedor>[] = [
    { encabezado: "Nombre", render: (p) => p.nombre },
    { encabezado: "Tipo", render: (p) => p.tipo },
    { encabezado: "Contacto", render: (p) => p.contacto ?? p.email ?? "—" },
    { encabezado: "Estado", render: (p) => <Badge color={ESTADO_COLOR[p.estado]}>{p.estado}</Badge> },
    {
      encabezado: "",
      render: (p) => (
        <button onClick={() => setSeleccionado(p.id)} className="text-sm font-medium text-brand-600 hover:underline">
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Proveedores y Terceros</h1>
        <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          + Nuevo proveedor
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={`${inputClass} w-auto`} value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Todos los tipos</option>
          {["INSUMOS", "SERVICIOS", "TRANSPORTE", "MAQUINARIA", "OTRO"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className={`${inputClass} w-auto`} value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {["EN_EVALUACION", "ACTIVO", "SUSPENDIDO", "INACTIVO"].map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <input placeholder="Buscar por nombre..." className={`${inputClass} w-64`} value={filtros.q} onChange={(e) => setFiltros({ ...filtros, q: e.target.value })} />
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando proveedores...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={proveedores} vacio="No hay proveedores registrados." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nuevo proveedor" onClose={() => setMostrarForm(false)}>
          <NuevoProveedorForm
            onCreado={() => {
              setMostrarForm(false);
              recargarLista();
            }}
            onCancelar={() => setMostrarForm(false)}
          />
        </Modal>
      )}

      {seleccionado && (
        <Modal titulo="Detalle del proveedor" onClose={() => setSeleccionado(null)}>
          <DetalleProveedor proveedorId={seleccionado} onCerrar={() => setSeleccionado(null)} />
        </Modal>
      )}
    </div>
  );
}
