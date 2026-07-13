import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { descargarArchivo } from "@/lib/descargas";
import type { CategoriaCambio, EstadoCambio, GestionCambio, RefNombre } from "@/types";

const CATEGORIAS: { valor: CategoriaCambio; etiqueta: string }[] = [
  { valor: "MATERIA_PRIMA_PROCESO_EQUIPO", etiqueta: "Materia prima, proveedor, proceso o equipo" },
  { valor: "ETIQUETADO_DECLARACION", etiqueta: "Etiquetado y declaraciones del producto" },
  { valor: "PPR_CONTROL_OPERACIONAL", etiqueta: "PPR y controles operacionales" },
  { valor: "REQUISITO_ESQUEMA_BOS", etiqueta: "Requisitos de esquema / decisión BoS" },
  { valor: "ALCANCE_CERTIFICACION", etiqueta: "Alcance de certificación" },
];
const CATEGORIA_LABEL = Object.fromEntries(CATEGORIAS.map((c) => [c.valor, c.etiqueta])) as Record<
  CategoriaCambio,
  string
>;

const ESTADO_COLOR: Record<EstadoCambio, "gris" | "azul" | "verde" | "amarillo" | "rojo"> = {
  BORRADOR: "amarillo",
  COMUNICADO: "azul",
  IMPLEMENTADO: "verde",
  CANCELADO: "gris",
};
const ESTADO_LABEL: Record<EstadoCambio, string> = {
  BORRADOR: "Borrador",
  COMUNICADO: "Comunicado",
  IMPLEMENTADO: "Implementado",
  CANCELADO: "Cancelado",
};

function NuevoCambioForm({
  procesos,
  onCreado,
  onCancelar,
}: {
  procesos: RefNombre[];
  onCreado: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({
    titulo: "",
    categoria: "MATERIA_PRIMA_PROCESO_EQUIPO" as CategoriaCambio,
    descripcion: "",
    impactoInocuidad: "",
    impactoAlcance: false,
    procesoId: "",
    documentosRelacionados: "",
    fechaEfectiva: "",
    plazoTransicion: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/cambios", {
        ...form,
        procesoId: form.procesoId || undefined,
        documentosRelacionados: form.documentosRelacionados || undefined,
        fechaEfectiva: form.fechaEfectiva || undefined,
        plazoTransicion: form.plazoTransicion || undefined,
      });
      onCreado();
    } catch {
      setError("No se pudo crear el cambio. Verificá los datos (el impacto necesita al menos 10 caracteres).");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Título">
        <input required className={inputClass} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
      </FormField>
      <FormField label="Categoría (requisito FSSC 22000)">
        <select
          className={inputClass}
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaCambio })}
        >
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Descripción del cambio">
        <textarea required className={inputClass} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </FormField>
      <FormField label="Impacto en inocuidad, cumplimiento o alcance">
        <textarea
          required
          minLength={10}
          className={inputClass}
          placeholder="Describí cómo afecta este cambio a la inocuidad, el cumplimiento normativo o el alcance de certificación..."
          value={form.impactoInocuidad}
          onChange={(e) => setForm({ ...form, impactoInocuidad: e.target.value })}
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={form.impactoAlcance} onChange={(e) => setForm({ ...form, impactoAlcance: e.target.checked })} />
        Afecta el alcance de certificación (nuevas actividades, categorías o subcategorías)
      </label>
      <FormField label="Proceso relacionado (opcional)">
        <select className={inputClass} value={form.procesoId} onChange={(e) => setForm({ ...form, procesoId: e.target.value })}>
          <option value="">Sin asignar</option>
          {procesos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Documentos relacionados (opcional)">
        <input
          className={inputClass}
          placeholder="Ej: POL-001, PRO-010"
          value={form.documentosRelacionados}
          onChange={(e) => setForm({ ...form, documentosRelacionados: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha efectiva (opcional)">
          <input type="date" className={inputClass} value={form.fechaEfectiva} onChange={(e) => setForm({ ...form, fechaEfectiva: e.target.value })} />
        </FormField>
        <FormField label="Plazo de transición (opcional)">
          <input type="date" className={inputClass} value={form.plazoTransicion} onChange={(e) => setForm({ ...form, plazoTransicion: e.target.value })} />
        </FormField>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {enviando ? "Creando..." : "Crear cambio"}
        </button>
      </div>
    </form>
  );
}

function DetalleCambio({ cambioId, onCerrar, onCambio }: { cambioId: string; onCerrar: () => void; onCambio: () => void }) {
  const [cambio, setCambio] = useState<GestionCambio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  function recargar() {
    apiClient.get<GestionCambio>(`/cambios/${cambioId}`).then((res) => setCambio(res.data));
  }
  useEffect(recargar, [cambioId]);

  async function comunicar() {
    if (!confirm("Esto va a notificar a TODOS los usuarios activos del sistema y no se puede deshacer. ¿Confirmás?")) return;
    setError(null);
    setProcesando(true);
    try {
      await apiClient.post(`/cambios/${cambioId}/comunicar`);
      recargar();
      onCambio();
    } catch {
      setError("No se pudo comunicar el cambio.");
    } finally {
      setProcesando(false);
    }
  }

  async function implementar() {
    setProcesando(true);
    try {
      await apiClient.post(`/cambios/${cambioId}/implementar`, {});
      recargar();
      onCambio();
    } finally {
      setProcesando(false);
    }
  }

  async function cancelar() {
    if (!confirm("¿Cancelar este cambio?")) return;
    setProcesando(true);
    try {
      await apiClient.post(`/cambios/${cambioId}/cancelar`);
      recargar();
      onCambio();
    } finally {
      setProcesando(false);
    }
  }

  if (!cambio) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">{cambio.codigo} · {CATEGORIA_LABEL[cambio.categoria]}</p>
          <h4 className="text-base font-semibold text-slate-800">{cambio.titulo}</h4>
        </div>
        <Badge color={ESTADO_COLOR[cambio.estado]}>{ESTADO_LABEL[cambio.estado]}</Badge>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600">Descripción</p>
        <p className="text-sm text-slate-700">{cambio.descripcion}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600">Impacto en inocuidad, cumplimiento o alcance</p>
        <p className="text-sm text-slate-700">{cambio.impactoInocuidad}</p>
      </div>
      {cambio.impactoAlcance && <Badge color="rojo">Afecta el alcance de certificación</Badge>}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-slate-400">Solicitante</dt>
          <dd className="text-slate-700">{cambio.solicitante?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Proceso</dt>
          <dd className="text-slate-700">{cambio.proceso?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Fecha efectiva</dt>
          <dd className="text-slate-700">{cambio.fechaEfectiva ? new Date(cambio.fechaEfectiva).toLocaleDateString("es-MX") : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Plazo de transición</dt>
          <dd className="text-slate-700">{cambio.plazoTransicion ? new Date(cambio.plazoTransicion).toLocaleDateString("es-MX") : "—"}</dd>
        </div>
        {cambio.comunicadoPor && (
          <div>
            <dt className="text-slate-400">Comunicado por</dt>
            <dd className="text-slate-700">
              {cambio.comunicadoPor.nombre} · {cambio.fechaComunicacion && new Date(cambio.fechaComunicacion).toLocaleDateString("es-MX")}
            </dd>
          </div>
        )}
        {cambio.fechaImplementacion && (
          <div>
            <dt className="text-slate-400">Implementado</dt>
            <dd className="text-slate-700">{new Date(cambio.fechaImplementacion).toLocaleDateString("es-MX")}</dd>
          </div>
        )}
      </dl>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3">
        {cambio.estado === "BORRADOR" && (
          <>
            <button
              onClick={cancelar}
              disabled={procesando}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Cancelar cambio
            </button>
            <button
              onClick={comunicar}
              disabled={procesando}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Comunicar a todos
            </button>
          </>
        )}
        {cambio.estado === "COMUNICADO" && (
          <button
            onClick={implementar}
            disabled={procesando}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Marcar como implementado
          </button>
        )}
        <button onClick={onCerrar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cerrar ventana
        </button>
      </div>
    </div>
  );
}

export function CambiosPage() {
  const [procesos, setProcesos] = useState<RefNombre[]>([]);
  const [filtros, setFiltros] = useState({ categoria: "", estado: "" });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const {
    items: cambios,
    pagination,
    setPage,
    cargando,
    recargar: recargarLista,
  } = usePaginatedList<GestionCambio>("/cambios", filtros);

  useEffect(() => {
    apiClient.get<RefNombre[]>("/procesos").then((res) => setProcesos(res.data));
  }, []);

  const columnas: Columna<GestionCambio>[] = [
    { encabezado: "Código", render: (c) => c.codigo },
    { encabezado: "Título", render: (c) => c.titulo },
    { encabezado: "Categoría", render: (c) => CATEGORIA_LABEL[c.categoria] },
    { encabezado: "Solicitante", render: (c) => c.solicitante?.nombre ?? "—" },
    { encabezado: "Estado", render: (c) => <Badge color={ESTADO_COLOR[c.estado]}>{ESTADO_LABEL[c.estado]}</Badge> },
    {
      encabezado: "",
      render: (c) => (
        <button onClick={() => setSeleccionado(c.id)} className="text-sm font-medium text-brand-600 hover:underline">
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Gestión de Cambios</h1>
          <p className="text-sm text-slate-400">Comunicación de cambios relevantes según FSSC 22000.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => descargarArchivo("/cambios/export", filtros, "gestion-cambios.xlsx")}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Exportar a Excel
          </button>
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Nuevo cambio
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={`${inputClass} w-auto`} value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
          ))}
        </select>
        <select className={`${inputClass} w-auto`} value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {(Object.keys(ESTADO_LABEL) as EstadoCambio[]).map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando cambios...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={cambios} vacio="No hay cambios registrados." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nuevo cambio" onClose={() => setMostrarForm(false)}>
          <NuevoCambioForm
            procesos={procesos}
            onCreado={() => {
              setMostrarForm(false);
              recargarLista();
            }}
            onCancelar={() => setMostrarForm(false)}
          />
        </Modal>
      )}

      {seleccionado && (
        <Modal titulo="Detalle del cambio" onClose={() => setSeleccionado(null)}>
          <DetalleCambio cambioId={seleccionado} onCerrar={() => setSeleccionado(null)} onCambio={recargarLista} />
        </Modal>
      )}
    </div>
  );
}
