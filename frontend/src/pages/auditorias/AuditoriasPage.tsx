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
import type { Auditoria, EstadoAuditoria, ProgramaAuditoria, RefNombre, Usuario } from "@/types";

const ESTADO_COLOR: Record<EstadoAuditoria, "gris" | "azul" | "verde" | "rojo"> = {
  PROGRAMADA: "gris",
  EN_EJECUCION: "azul",
  FINALIZADA: "verde",
  CANCELADA: "rojo",
};

function NuevaAuditoriaForm({
  programas,
  usuarios,
  onCreado,
  onCancelar,
}: {
  programas: ProgramaAuditoria[];
  usuarios: Usuario[];
  onCreado: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({
    programaId: "",
    tipo: "INTERNA",
    alcance: "",
    fechaInicio: "",
    fechaFin: "",
    liderAuditorId: "",
    equipoAuditor: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/auditorias", { ...form, programaId: form.programaId || undefined });
      onCreado();
    } catch {
      setError("No se pudo crear la auditoría. Verifica los datos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Programa (opcional)">
        <select className={inputClass} value={form.programaId} onChange={(e) => setForm({ ...form, programaId: e.target.value })}>
          <option value="">Sin asignar</option>
          {programas.map((p) => (
            <option key={p.id} value={p.id}>{p.anio} · {p.nombre}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Tipo">
        <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          <option value="INTERNA">Interna</option>
          <option value="EXTERNA">Externa</option>
          <option value="CERTIFICACION">Certificación</option>
        </select>
      </FormField>
      <FormField label="Alcance">
        <textarea required className={inputClass} value={form.alcance} onChange={(e) => setForm({ ...form, alcance: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha inicio">
          <input type="date" required className={inputClass} value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
        </FormField>
        <FormField label="Fecha fin">
          <input type="date" required className={inputClass} value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
        </FormField>
      </div>
      <FormField label="Líder auditor">
        <select required className={inputClass} value={form.liderAuditorId} onChange={(e) => setForm({ ...form, liderAuditorId: e.target.value })}>
          <option value="">Selecciona...</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Equipo auditor (opcional)">
        <input className={inputClass} placeholder="Nombres separados por coma" value={form.equipoAuditor} onChange={(e) => setForm({ ...form, equipoAuditor: e.target.value })} />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {enviando ? "Creando..." : "Crear auditoría"}
        </button>
      </div>
    </form>
  );
}

function NuevoChecklistForm({ auditoriaId, onCreado }: { auditoriaId: string; onCreado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [preguntas, setPreguntas] = useState("");
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/auditorias/${auditoriaId}/checklists`, {
      nombre,
      preguntas: preguntas.split("\n").map((p) => p.trim()).filter(Boolean),
    });
    setNombre("");
    setPreguntas("");
    setMostrar(false);
    onCreado();
  }

  if (!mostrar) {
    return (
      <button onClick={() => setMostrar(true)} className="text-sm font-medium text-brand-600 hover:underline">
        + Agregar checklist
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 p-3">
      <input required placeholder="Nombre del checklist" className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <textarea placeholder="Una pregunta por línea" className={inputClass} value={preguntas} onChange={(e) => setPreguntas(e.target.value)} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setMostrar(false)} className="text-sm text-slate-500">Cancelar</button>
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white">Guardar</button>
      </div>
    </form>
  );
}

function NuevoHallazgoForm({ auditoriaId, procesos, usuarios, onCreado }: { auditoriaId: string; procesos: RefNombre[]; usuarios: Usuario[]; onCreado: () => void }) {
  const [form, setForm] = useState({ tipo: "OBSERVACION", descripcion: "", procesoId: "", responsableId: "" });
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/auditorias/${auditoriaId}/hallazgos`, {
      ...form,
      procesoId: form.procesoId || undefined,
      responsableId: form.responsableId || undefined,
    });
    setForm({ tipo: "OBSERVACION", descripcion: "", procesoId: "", responsableId: "" });
    setMostrar(false);
    onCreado();
  }

  if (!mostrar) {
    return (
      <button onClick={() => setMostrar(true)} className="text-sm font-medium text-brand-600 hover:underline">
        + Agregar hallazgo
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 p-3">
      <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
        <option value="OBSERVACION">Observación</option>
        <option value="NO_CONFORMIDAD">No conformidad (genera NC automáticamente)</option>
        <option value="OPORTUNIDAD_MEJORA">Oportunidad de mejora</option>
        <option value="FORTALEZA">Fortaleza</option>
      </select>
      <textarea required placeholder="Descripción del hallazgo" className={inputClass} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      <select className={inputClass} value={form.procesoId} onChange={(e) => setForm({ ...form, procesoId: e.target.value })}>
        <option value="">Proceso (opcional)</option>
        {procesos.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      <select className={inputClass} value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
        <option value="">Responsable (opcional)</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>{u.nombre}</option>
        ))}
      </select>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setMostrar(false)} className="text-sm text-slate-500">Cancelar</button>
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white">Guardar</button>
      </div>
    </form>
  );
}

function InformeForm({ auditoriaId, onCreado }: { auditoriaId: string; onCreado: () => void }) {
  const [form, setForm] = useState<{ resumen: string; conclusiones: string; archivoUrl?: string }>({
    resumen: "",
    conclusiones: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/auditorias/${auditoriaId}/informe`, form);
    onCreado();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md bg-slate-50 p-3">
      <FormField label="Resumen">
        <textarea required className={inputClass} value={form.resumen} onChange={(e) => setForm({ ...form, resumen: e.target.value })} />
      </FormField>
      <FormField label="Conclusiones">
        <textarea className={inputClass} value={form.conclusiones} onChange={(e) => setForm({ ...form, conclusiones: e.target.value })} />
      </FormField>
      <FormField label="Documento del informe (opcional)">
        <FileUpload value={form.archivoUrl} onChange={(archivoUrl) => setForm({ ...form, archivoUrl })} />
      </FormField>
      <button type="submit" className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
        Emitir informe y finalizar auditoría
      </button>
    </form>
  );
}

function DetalleAuditoria({
  auditoriaId,
  procesos,
  usuarios,
  onCerrar,
  onCambio,
}: {
  auditoriaId: string;
  procesos: RefNombre[];
  usuarios: Usuario[];
  onCerrar: () => void;
  onCambio: () => void;
}) {
  const [auditoria, setAuditoria] = useState<Auditoria | null>(null);

  function recargar() {
    apiClient.get<Auditoria>(`/auditorias/${auditoriaId}`).then((res) => setAuditoria(res.data));
  }

  useEffect(recargar, [auditoriaId]);

  async function responder(preguntaId: string, respuesta: string) {
    await apiClient.put(`/auditorias/checklists/preguntas/${preguntaId}`, { respuesta });
    recargar();
  }

  async function ejecutar(accion: () => Promise<unknown>) {
    await accion();
    recargar();
    onCambio();
  }

  if (!auditoria) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">{auditoria.tipo}</p>
          <h4 className="text-base font-semibold text-slate-800">{auditoria.alcance}</h4>
          <p className="text-xs text-slate-400">Líder: {auditoria.liderAuditor?.nombre}</p>
        </div>
        <Badge color={ESTADO_COLOR[auditoria.estado]}>{auditoria.estado}</Badge>
      </div>

      <div className="flex gap-2">
        {auditoria.estado === "PROGRAMADA" && (
          <>
            <button onClick={() => ejecutar(() => apiClient.post(`/auditorias/${auditoriaId}/iniciar`))} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              Iniciar auditoría
            </button>
            <button onClick={() => ejecutar(() => apiClient.post(`/auditorias/${auditoriaId}/cancelar`))} className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Cancelar
            </button>
          </>
        )}
      </div>

      {auditoria.estado !== "PROGRAMADA" && auditoria.estado !== "CANCELADA" && (
        <>
          <div>
            <h5 className="mb-2 text-sm font-semibold text-slate-600">Checklists</h5>
            <div className="space-y-2">
              {(auditoria.checklists ?? []).map((c) => (
                <div key={c.id} className="rounded-md border border-slate-200 p-2">
                  <p className="text-sm font-medium text-slate-700">{c.nombre}</p>
                  <ul className="mt-1 space-y-1">
                    {c.preguntas.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{p.texto}</span>
                        <select className="rounded-md border border-slate-300 px-2 py-0.5 text-xs" value={p.respuesta} onChange={(e) => responder(p.id, e.target.value)}>
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="CUMPLE">Cumple</option>
                          <option value="NO_CUMPLE">No cumple</option>
                          <option value="NO_APLICA">No aplica</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <NuevoChecklistForm auditoriaId={auditoriaId} onCreado={recargar} />
            </div>
          </div>

          <div>
            <h5 className="mb-2 text-sm font-semibold text-slate-600">Hallazgos</h5>
            <ul className="space-y-1">
              {(auditoria.hallazgos ?? []).map((h) => (
                <li key={h.id} className="rounded-md border border-slate-200 p-2 text-sm">
                  <span className="mr-2 text-xs text-slate-400">[{h.tipo}]</span>
                  {h.descripcion}
                  {h.noConformidad && <span className="ml-2 text-xs text-red-600">→ NC {h.noConformidad.codigo}</span>}
                </li>
              ))}
              {(auditoria.hallazgos ?? []).length === 0 && <p className="text-sm text-slate-400">Sin hallazgos aún.</p>}
            </ul>
            <div className="mt-2">
              <NuevoHallazgoForm auditoriaId={auditoriaId} procesos={procesos} usuarios={usuarios} onCreado={recargar} />
            </div>
          </div>

          {auditoria.estado === "EN_EJECUCION" && !auditoria.informe && (
            <div>
              <h5 className="mb-2 text-sm font-semibold text-slate-600">Informe final</h5>
              <InformeForm auditoriaId={auditoriaId} onCreado={() => ejecutar(() => Promise.resolve())} />
            </div>
          )}

          {auditoria.informe && (
            <div className="rounded-md bg-emerald-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-emerald-800">Informe emitido</p>
                <button
                  onClick={() =>
                    descargarArchivo(
                      `/auditorias/${auditoriaId}/informe/pdf`,
                      {},
                      `informe-auditoria-${auditoriaId}.pdf`
                    )
                  }
                  className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Descargar PDF
                </button>
              </div>
              <p className="text-emerald-700">{auditoria.informe.resumen}</p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end">
        <button onClick={onCerrar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function AuditoriasPage() {
  const [programas, setProgramas] = useState<ProgramaAuditoria[]>([]);
  const [procesos, setProcesos] = useState<RefNombre[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const {
    items: auditorias,
    pagination,
    setPage,
    cargando,
    recargar: recargarLista,
  } = usePaginatedList<Auditoria>("/auditorias", {});

  useEffect(() => {
    apiClient.get<ProgramaAuditoria[]>("/programas-auditoria").then((res) => setProgramas(res.data));
    apiClient.get<RefNombre[]>("/procesos").then((res) => setProcesos(res.data));
    apiClient.get<Usuario[]>("/usuarios").then((res) => setUsuarios(res.data));
  }, []);

  const columnas: Columna<Auditoria>[] = [
    { encabezado: "Tipo", render: (a) => a.tipo },
    { encabezado: "Alcance", render: (a) => a.alcance },
    { encabezado: "Fecha inicio", render: (a) => new Date(a.fechaInicio).toLocaleDateString() },
    { encabezado: "Líder", render: (a) => a.liderAuditor?.nombre ?? "—" },
    { encabezado: "Estado", render: (a) => <Badge color={ESTADO_COLOR[a.estado]}>{a.estado}</Badge> },
    {
      encabezado: "",
      render: (a) => (
        <button onClick={() => setSeleccionado(a.id)} className="text-sm font-medium text-brand-600 hover:underline">
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Auditorías</h1>
        <div className="flex gap-2">
          <button
            onClick={() => descargarArchivo("/auditorias/export", {}, "auditorias.xlsx")}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Exportar a Excel
          </button>
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Nueva auditoría
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando auditorías...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={auditorias} vacio="No hay auditorías registradas." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nueva auditoría" onClose={() => setMostrarForm(false)}>
          <NuevaAuditoriaForm
            programas={programas}
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
        <Modal titulo="Detalle de la auditoría" onClose={() => setSeleccionado(null)}>
          <DetalleAuditoria
            auditoriaId={seleccionado}
            procesos={procesos}
            usuarios={usuarios}
            onCerrar={() => setSeleccionado(null)}
            onCambio={recargarLista}
          />
        </Modal>
      )}
    </div>
  );
}
