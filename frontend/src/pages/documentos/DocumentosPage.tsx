import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { descargarArchivo } from "@/lib/descargas";
import type { Area, Documento, TipoDocumento, Usuario } from "@/types";

const ESTADO_COLOR = {
  BORRADOR: "gris",
  EN_REVISION: "amarillo",
  APROBADO: "verde",
  OBSOLETO: "rojo",
} as const;

function useCatalogos() {
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    apiClient.get<TipoDocumento[]>("/tipos-documento").then((res) => setTipos(res.data));
    apiClient.get<Area[]>("/areas").then((res) => setAreas(res.data));
    apiClient.get<Usuario[]>("/usuarios").then((res) => setUsuarios(res.data));
  }, []);

  return { tipos, areas, usuarios };
}

function NuevoDocumentoForm({
  tipos,
  areas,
  usuarios,
  onCreado,
  onCancelar,
}: {
  tipos: TipoDocumento[];
  areas: Area[];
  usuarios: Usuario[];
  onCreado: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({
    codigo: "",
    titulo: "",
    tipoDocumentoId: "",
    areaId: "",
    responsableId: "",
    proximaRevision: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/documentos", {
        ...form,
        proximaRevision: form.proximaRevision || undefined,
      });
      onCreado();
    } catch {
      setError("No se pudo crear el documento. Verifica los datos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Código">
        <input
          required
          className={inputClass}
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
        />
      </FormField>
      <FormField label="Título">
        <input
          required
          className={inputClass}
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        />
      </FormField>
      <FormField label="Tipo de documento">
        <select
          required
          className={inputClass}
          value={form.tipoDocumentoId}
          onChange={(e) => setForm({ ...form, tipoDocumentoId: e.target.value })}
        >
          <option value="">Selecciona...</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Área">
        <select
          required
          className={inputClass}
          value={form.areaId}
          onChange={(e) => setForm({ ...form, areaId: e.target.value })}
        >
          <option value="">Selecciona...</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Responsable">
        <select
          required
          className={inputClass}
          value={form.responsableId}
          onChange={(e) => setForm({ ...form, responsableId: e.target.value })}
        >
          <option value="">Selecciona...</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Próxima revisión (opcional)">
        <input
          type="date"
          className={inputClass}
          value={form.proximaRevision}
          onChange={(e) => setForm({ ...form, proximaRevision: e.target.value })}
        />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {enviando ? "Creando..." : "Crear documento"}
        </button>
      </div>
    </form>
  );
}

function DetalleDocumento({ documentoId, onCerrar, onCambio }: { documentoId: string; onCerrar: () => void; onCambio: () => void }) {
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [accionando, setAccionando] = useState(false);

  function recargar() {
    apiClient.get<Documento>(`/documentos/${documentoId}`).then((res) => setDocumento(res.data));
  }

  useEffect(recargar, [documentoId]);

  async function ejecutar(accion: () => Promise<unknown>) {
    setAccionando(true);
    try {
      await accion();
      recargar();
      onCambio();
    } catch {
      // el usuario puede reintentar; se podría mostrar un toast aquí
    } finally {
      setAccionando(false);
    }
  }

  if (!documento) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">{documento.codigo}</p>
          <h4 className="text-lg font-semibold text-slate-800">{documento.titulo}</h4>
        </div>
        <Badge color={ESTADO_COLOR[documento.estado]}>{documento.estado}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {documento.estado === "BORRADOR" && (
          <button
            disabled={accionando}
            onClick={() => ejecutar(() => apiClient.post(`/documentos/${documentoId}/enviar-revision`))}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Enviar a revisión
          </button>
        )}
        {documento.estado === "EN_REVISION" && (
          <button
            disabled={accionando}
            onClick={() => ejecutar(() => apiClient.post(`/documentos/${documentoId}/aprobar`))}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Aprobar
          </button>
        )}
        {documento.estado === "APROBADO" && (
          <>
            <button
              disabled={accionando}
              onClick={() =>
                ejecutar(() => apiClient.post(`/documentos/${documentoId}/versiones`, {}))
              }
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Nueva versión
            </button>
            <button
              disabled={accionando}
              onClick={() => ejecutar(() => apiClient.post(`/documentos/${documentoId}/obsoleto`))}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Marcar obsoleto
            </button>
            <button
              disabled={accionando}
              onClick={() =>
                ejecutar(() => apiClient.post(`/documentos/${documentoId}/evidencias-lectura`, {}))
              }
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Registrar mi lectura
            </button>
          </>
        )}
      </div>

      <div>
        <h5 className="mb-2 text-sm font-semibold text-slate-600">Historial de versiones</h5>
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium text-slate-500">#</th>
                <th className="px-3 py-1.5 text-left font-medium text-slate-500">Estado</th>
                <th className="px-3 py-1.5 text-left font-medium text-slate-500">Creado por</th>
                <th className="px-3 py-1.5 text-left font-medium text-slate-500">Aprobado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documento.versiones?.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-1.5">{v.numeroVersion}</td>
                  <td className="px-3 py-1.5">
                    <Badge color={ESTADO_COLOR[v.estado]}>{v.estado}</Badge>
                  </td>
                  <td className="px-3 py-1.5">{v.creadoPor.nombre}</td>
                  <td className="px-3 py-1.5">{v.aprobadoPor?.nombre ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

export function DocumentosPage() {
  const { tipos, areas, usuarios } = useCatalogos();
  const [filtros, setFiltros] = useState({ tipoDocumentoId: "", areaId: "", estado: "", q: "" });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<string | null>(null);

  const {
    items: documentos,
    pagination,
    setPage,
    cargando,
    recargar: recargarLista,
  } = usePaginatedList<Documento>("/documentos", filtros);

  const columnas: Columna<Documento>[] = [
    { encabezado: "Código", render: (d) => d.codigo },
    { encabezado: "Título", render: (d) => d.titulo },
    { encabezado: "Tipo", render: (d) => d.tipoDocumento?.nombre ?? "—" },
    { encabezado: "Área", render: (d) => d.area?.nombre ?? "—" },
    { encabezado: "Responsable", render: (d) => d.responsable?.nombre ?? "—" },
    {
      encabezado: "Estado",
      render: (d) => <Badge color={ESTADO_COLOR[d.estado]}>{d.estado}</Badge>,
    },
    {
      encabezado: "",
      render: (d) => (
        <button onClick={() => setDocumentoSeleccionado(d.id)} className="text-sm font-medium text-brand-600 hover:underline">
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Gestión Documental</h1>
        <div className="flex gap-2">
          <button
            onClick={() => descargarArchivo("/documentos/export", filtros, "documentos.xlsx")}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Exportar a Excel
          </button>
          <button
            onClick={() => setMostrarForm(true)}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Nuevo documento
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className={`${inputClass} w-auto`}
          value={filtros.tipoDocumentoId}
          onChange={(e) => setFiltros({ ...filtros, tipoDocumentoId: e.target.value })}
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} w-auto`}
          value={filtros.areaId}
          onChange={(e) => setFiltros({ ...filtros, areaId: e.target.value })}
        >
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} w-auto`}
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="">Todos los estados</option>
          {Object.keys(ESTADO_COLOR).map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
        <input
          placeholder="Buscar por código o título..."
          className={`${inputClass} w-64`}
          value={filtros.q}
          onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
        />
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando documentos...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={documentos} vacio="No hay documentos registrados." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nuevo documento" onClose={() => setMostrarForm(false)}>
          <NuevoDocumentoForm
            tipos={tipos}
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

      {documentoSeleccionado && (
        <Modal titulo="Detalle del documento" onClose={() => setDocumentoSeleccionado(null)}>
          <DetalleDocumento
            documentoId={documentoSeleccionado}
            onCerrar={() => setDocumentoSeleccionado(null)}
            onCambio={recargarLista}
          />
        </Modal>
      )}
    </div>
  );
}
