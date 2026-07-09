import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { FileUpload } from "@/components/common/FileUpload";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { descargarArchivo } from "@/lib/descargas";
import type { EstadoNC, NoConformidad, RefNombre, Usuario } from "@/types";

const ESTADO_COLOR: Record<EstadoNC, "gris" | "azul" | "verde" | "amarillo" | "rojo"> = {
  ABIERTA: "rojo",
  EN_ANALISIS: "amarillo",
  ACCION_DEFINIDA: "amarillo",
  EN_IMPLEMENTACION: "azul",
  CERRADA: "verde",
  INEFICAZ: "rojo",
};

function NuevaNCForm({
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
    codigo: "",
    origen: "INSPECCION",
    descripcion: "",
    procesoId: "",
    responsableId: "",
    fechaCompromiso: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/no-conformidades", {
        ...form,
        procesoId: form.procesoId || undefined,
        fechaCompromiso: form.fechaCompromiso || undefined,
      });
      onCreado();
    } catch {
      setError("No se pudo crear la NC. Verifica los datos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Código">
        <input required className={inputClass} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
      </FormField>
      <FormField label="Origen">
        <select className={inputClass} value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })}>
          {["AUDITORIA", "RECLAMO", "INCIDENTE", "INSPECCION", "AUTOEVALUACION"].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Descripción">
        <textarea required className={inputClass} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </FormField>
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
      <FormField label="Fecha compromiso (opcional)">
        <input type="date" className={inputClass} value={form.fechaCompromiso} onChange={(e) => setForm({ ...form, fechaCompromiso: e.target.value })} />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {enviando ? "Creando..." : "Crear NC"}
        </button>
      </div>
    </form>
  );
}

function NuevaAccionForm({ ncId, usuarios, onCreado }: { ncId: string; usuarios: Usuario[]; onCreado: () => void }) {
  const [form, setForm] = useState<{
    descripcion: string;
    tipo: string;
    responsableId: string;
    fechaCompromiso: string;
    evidenciaUrl?: string;
  }>({ descripcion: "", tipo: "CORRECTIVA", responsableId: "", fechaCompromiso: "" });
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/no-conformidades/${ncId}/acciones`, form);
    setForm({ descripcion: "", tipo: "CORRECTIVA", responsableId: "", fechaCompromiso: "" });
    setMostrar(false);
    onCreado();
  }

  if (!mostrar) {
    return (
      <button onClick={() => setMostrar(true)} className="text-sm font-medium text-brand-600 hover:underline">
        + Agregar acción
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 p-3">
      <textarea required placeholder="Descripción de la acción" className={inputClass} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
        <option value="INMEDIATA">Inmediata</option>
        <option value="CORRECTIVA">Correctiva</option>
        <option value="PREVENTIVA">Preventiva</option>
      </select>
      <select required className={inputClass} value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
        <option value="">Responsable...</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>{u.nombre}</option>
        ))}
      </select>
      <input type="date" required className={inputClass} value={form.fechaCompromiso} onChange={(e) => setForm({ ...form, fechaCompromiso: e.target.value })} />
      <FormField label="Evidencia (opcional)">
        <FileUpload value={form.evidenciaUrl} onChange={(evidenciaUrl) => setForm({ ...form, evidenciaUrl })} />
      </FormField>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setMostrar(false)} className="text-sm text-slate-500">Cancelar</button>
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white">Guardar</button>
      </div>
    </form>
  );
}

function DetalleNC({ ncId, usuarios, onCerrar, onCambio }: { ncId: string; usuarios: Usuario[]; onCerrar: () => void; onCambio: () => void }) {
  const [nc, setNc] = useState<NoConformidad | null>(null);
  const [causaRaiz, setCausaRaiz] = useState("");
  const [evidenciaCierre, setEvidenciaCierre] = useState("");
  const [error, setError] = useState<string | null>(null);

  function recargar() {
    apiClient.get<NoConformidad>(`/no-conformidades/${ncId}`).then((res) => {
      setNc(res.data);
      setCausaRaiz(res.data.causaRaiz ?? "");
    });
  }

  useEffect(recargar, [ncId]);

  async function guardarCausaRaiz() {
    await apiClient.put(`/no-conformidades/${ncId}`, { causaRaiz, estado: "EN_ANALISIS" });
    recargar();
    onCambio();
  }

  async function actualizarEstadoAccion(accionId: string, estado: string) {
    await apiClient.put(`/no-conformidades/${ncId}/acciones/${accionId}`, { estado });
    recargar();
    onCambio();
  }

  async function cerrarNC() {
    setError(null);
    try {
      await apiClient.post(`/no-conformidades/${ncId}/cerrar`, { evidenciaCierre });
      recargar();
      onCambio();
    } catch {
      setError("No se puede cerrar: revisa que todas las acciones estén completadas.");
    }
  }

  if (!nc) return <p className="text-sm text-slate-400">Cargando...</p>;

  const todasCompletadas = (nc.acciones ?? []).length > 0 && (nc.acciones ?? []).every((a) => a.estado === "COMPLETADA");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">{nc.codigo} · {nc.origen}</p>
          <h4 className="text-base font-semibold text-slate-800">{nc.descripcion}</h4>
        </div>
        <Badge color={ESTADO_COLOR[nc.estado]}>{nc.estado}</Badge>
      </div>

      <FormField label="Análisis de causa raíz">
        <textarea className={inputClass} value={causaRaiz} onChange={(e) => setCausaRaiz(e.target.value)} />
      </FormField>
      <button onClick={guardarCausaRaiz} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
        Guardar análisis
      </button>

      <div>
        <h5 className="mb-2 text-sm font-semibold text-slate-600">Acciones</h5>
        <ul className="space-y-2">
          {(nc.acciones ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 text-sm">
              <div>
                <p className="text-slate-700">
                  <span className="mr-1 text-xs text-slate-400">[{a.tipo}]</span>
                  {a.descripcion}
                </p>
                <p className="text-xs text-slate-400">{a.responsable?.nombre} · vence {new Date(a.fechaCompromiso).toLocaleDateString()}</p>
              </div>
              <select
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                value={a.estado}
                onChange={(e) => actualizarEstadoAccion(a.id, e.target.value)}
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </li>
          ))}
          {(nc.acciones ?? []).length === 0 && <p className="text-sm text-slate-400">Sin acciones definidas aún.</p>}
        </ul>
        <div className="mt-2">
          <NuevaAccionForm ncId={ncId} usuarios={usuarios} onCreado={recargar} />
        </div>
      </div>

      {nc.estado !== "CERRADA" && (
        <div className="space-y-2 rounded-md bg-slate-50 p-3">
          <FormField label="Evidencia de cierre">
            <textarea
              className={inputClass}
              value={evidenciaCierre}
              onChange={(e) => setEvidenciaCierre(e.target.value)}
              placeholder={todasCompletadas ? "Describe la evidencia de cierre..." : "Completa todas las acciones para poder cerrar"}
            />
          </FormField>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={!todasCompletadas || !evidenciaCierre}
            onClick={cerrarNC}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Cerrar NC
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onCerrar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cerrar ventana
        </button>
      </div>
    </div>
  );
}

export function NoConformidadesPage() {
  const [procesos, setProcesos] = useState<RefNombre[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtros, setFiltros] = useState({ estado: "", origen: "" });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const {
    items: ncs,
    pagination,
    setPage,
    cargando,
    recargar: recargarLista,
  } = usePaginatedList<NoConformidad>("/no-conformidades", filtros);

  useEffect(() => {
    apiClient.get<RefNombre[]>("/procesos").then((res) => setProcesos(res.data));
    apiClient.get<Usuario[]>("/usuarios").then((res) => setUsuarios(res.data));
  }, []);

  const columnas: Columna<NoConformidad>[] = [
    { encabezado: "Código", render: (n) => n.codigo },
    { encabezado: "Origen", render: (n) => n.origen },
    { encabezado: "Descripción", render: (n) => n.descripcion },
    { encabezado: "Responsable", render: (n) => n.responsable?.nombre ?? "—" },
    { encabezado: "Estado", render: (n) => <Badge color={ESTADO_COLOR[n.estado]}>{n.estado}</Badge> },
    {
      encabezado: "",
      render: (n) => (
        <button onClick={() => setSeleccionado(n.id)} className="text-sm font-medium text-brand-600 hover:underline">
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">No Conformidades y Acciones</h1>
        <div className="flex gap-2">
          <button
            onClick={() => descargarArchivo("/no-conformidades/export", filtros, "no-conformidades.xlsx")}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Exportar a Excel
          </button>
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Nueva NC
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={`${inputClass} w-auto`} value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {(["ABIERTA", "EN_ANALISIS", "ACCION_DEFINIDA", "EN_IMPLEMENTACION", "CERRADA", "INEFICAZ"] as const).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select className={`${inputClass} w-auto`} value={filtros.origen} onChange={(e) => setFiltros({ ...filtros, origen: e.target.value })}>
          <option value="">Todos los orígenes</option>
          {(["AUDITORIA", "RECLAMO", "INCIDENTE", "INSPECCION", "AUTOEVALUACION"] as const).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando no conformidades...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={ncs} vacio="No hay no conformidades registradas." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nueva no conformidad" onClose={() => setMostrarForm(false)}>
          <NuevaNCForm
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
        <Modal titulo="Detalle de la NC" onClose={() => setSeleccionado(null)}>
          <DetalleNC ncId={seleccionado} usuarios={usuarios} onCerrar={() => setSeleccionado(null)} onCambio={recargarLista} />
        </Modal>
      )}
    </div>
  );
}
