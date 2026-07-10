import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { FormField, inputClass } from "@/components/common/FormField";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import type { Area, NombreRol, Persona, Puesto, Usuario } from "@/types";

const ROLES: NombreRol[] = ["ADMIN", "AUDITOR", "RESPONSABLE_PROCESO", "LECTURA"];

function PersonaForm({
  persona,
  areas,
  puestos,
  onGuardado,
  onCancelar,
}: {
  persona: Persona | null;
  areas: Area[];
  puestos: Puesto[];
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [usuarioExistente, setUsuarioExistente] = useState<Usuario | null | undefined>(undefined);
  const [form, setForm] = useState({
    nombre: persona?.nombre ?? "",
    apellido: persona?.apellido ?? "",
    email: persona?.email ?? "",
    telefono: persona?.telefono ?? "",
    areaId: persona?.areaId ?? "",
    puestoId: persona?.puestoId ?? "",
  });
  const [darAcceso, setDarAcceso] = useState(false);
  const [rol, setRol] = useState<NombreRol>("LECTURA");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!persona) {
      setUsuarioExistente(null);
      return;
    }
    apiClient.get<Usuario[]>("/usuarios").then((res) => {
      const usuario = res.data.find((u) => u.personaId === persona.id) ?? null;
      setUsuarioExistente(usuario);
      if (usuario) setRol(usuario.rol);
    });
  }, [persona]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (darAcceso && !form.email) {
      setError("El email es obligatorio para dar acceso al sistema.");
      return;
    }
    if (darAcceso && !usuarioExistente && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const datosPersona = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email || undefined,
        telefono: form.telefono || undefined,
        areaId: form.areaId || undefined,
        puestoId: form.puestoId || undefined,
      };

      const personaGuardada = persona
        ? (await apiClient.put(`/personas/${persona.id}`, datosPersona)).data
        : (await apiClient.post("/personas", datosPersona)).data;

      if (usuarioExistente) {
        if (usuarioExistente.rol !== rol) {
          await apiClient.put(`/usuarios/${usuarioExistente.id}`, { rol });
        }
      } else if (darAcceso) {
        await apiClient.post("/usuarios", {
          nombre: `${form.nombre} ${form.apellido}`,
          email: form.email,
          password,
          rol,
          personaId: personaGuardada.id,
        });
      }

      onGuardado();
    } catch {
      setError("No se pudo guardar. Verificá los datos (el email podría ya estar en uso).");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nombre">
          <input required className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </FormField>
        <FormField label="Apellido">
          <input required className={inputClass} value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
        </FormField>
      </div>
      <FormField label="Email">
        <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </FormField>
      <FormField label="Teléfono (opcional)">
        <input className={inputClass} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Área (opcional)">
          <select className={inputClass} value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}>
            <option value="">Sin asignar</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Puesto (opcional)">
          <select className={inputClass} value={form.puestoId} onChange={(e) => setForm({ ...form, puestoId: e.target.value })}>
            <option value="">Sin asignar</option>
            {puestos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="rounded-md border border-slate-200 p-3">
        {usuarioExistente ? (
          <>
            <p className="text-sm font-medium text-slate-700">Ya tiene acceso al sistema</p>
            <p className="mb-2 text-xs text-slate-400">Podés cambiar su rol de permisos.</p>
            <FormField label="Rol">
              <select className={inputClass} value={rol} onChange={(e) => setRol(e.target.value as NombreRol)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </FormField>
          </>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={darAcceso} onChange={(e) => setDarAcceso(e.target.checked)} />
              Dar acceso al sistema (crear usuario con rol)
            </label>
            {darAcceso && (
              <div className="mt-3 space-y-3">
                <FormField label="Rol">
                  <select className={inputClass} value={rol} onChange={(e) => setRol(e.target.value as NombreRol)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Contraseña inicial">
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                  />
                </FormField>
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {enviando ? "Guardando..." : persona ? "Guardar cambios" : "Crear persona"}
        </button>
      </div>
    </form>
  );
}

function AreasManager({ onClose, onCambio }: { onClose: () => void; onCambio: () => void }) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    apiClient.get<Area[]>("/areas").then((res) => setAreas(res.data));
  }
  useEffect(cargar, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/areas", { nombre: nuevoNombre, descripcion: nuevaDescripcion || undefined });
      setNuevoNombre("");
      setNuevaDescripcion("");
      cargar();
      onCambio();
    } catch {
      setError("No se pudo crear el área (¿nombre repetido?).");
    }
  }

  function iniciarEdicion(area: Area) {
    setEditando(area.id);
    setEditNombre(area.nombre);
    setEditDescripcion(area.descripcion ?? "");
  }

  async function guardarEdicion(id: string) {
    setError(null);
    try {
      await apiClient.put(`/areas/${id}`, { nombre: editNombre, descripcion: editDescripcion || undefined });
      setEditando(null);
      cargar();
      onCambio();
    } catch {
      setError("No se pudo guardar los cambios.");
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta área?")) return;
    await apiClient.delete(`/areas/${id}`);
    cargar();
    onCambio();
  }

  return (
    <Modal titulo="Gestionar áreas" onClose={onClose}>
      <div className="space-y-3">
        <form onSubmit={crear} className="flex gap-2">
          <input required placeholder="Nombre del área" className={inputClass} value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
          <input placeholder="Descripción (opcional)" className={inputClass} value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} />
          <button type="submit" className="whitespace-nowrap rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Agregar
          </button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {areas.map((a) => (
            <li key={a.id} className="rounded-md border border-slate-200 p-2 text-sm">
              {editando === a.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input className={inputClass} value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                  <input className={inputClass} value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
                  <button onClick={() => guardarEdicion(a.id)} className="text-sm font-medium text-brand-600 hover:underline">Guardar</button>
                  <button onClick={() => setEditando(null)} className="text-sm text-slate-500">Cancelar</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-700">{a.nombre}</span>
                    {a.descripcion && <span className="ml-2 text-xs text-slate-400">{a.descripcion}</span>}
                    {!a.activo && <Badge color="gris">Inactiva</Badge>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => iniciarEdicion(a)} className="text-sm font-medium text-brand-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(a.id)} className="text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {areas.length === 0 && <p className="text-sm text-slate-400">No hay áreas registradas.</p>}
        </ul>
      </div>
    </Modal>
  );
}

function PuestosManager({ areas, onClose, onCambio }: { areas: Area[]; onClose: () => void; onCambio: () => void }) {
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaAreaId, setNuevaAreaId] = useState(areas[0]?.id ?? "");
  const [editando, setEditando] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editAreaId, setEditAreaId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    apiClient.get<Puesto[]>("/puestos").then((res) => setPuestos(res.data));
  }
  useEffect(cargar, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/puestos", { nombre: nuevoNombre, areaId: nuevaAreaId });
      setNuevoNombre("");
      cargar();
      onCambio();
    } catch {
      setError("No se pudo crear el puesto.");
    }
  }

  function iniciarEdicion(puesto: Puesto) {
    setEditando(puesto.id);
    setEditNombre(puesto.nombre);
    setEditAreaId(puesto.areaId);
  }

  async function guardarEdicion(id: string) {
    setError(null);
    try {
      await apiClient.put(`/puestos/${id}`, { nombre: editNombre, areaId: editAreaId });
      setEditando(null);
      cargar();
      onCambio();
    } catch {
      setError("No se pudo guardar los cambios.");
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este puesto?")) return;
    await apiClient.delete(`/puestos/${id}`);
    cargar();
    onCambio();
  }

  return (
    <Modal titulo="Gestionar puestos" onClose={onClose}>
      <div className="space-y-3">
        <form onSubmit={crear} className="flex gap-2">
          <input required placeholder="Nombre del puesto" className={inputClass} value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
          <select required className={inputClass} value={nuevaAreaId} onChange={(e) => setNuevaAreaId(e.target.value)}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          <button type="submit" className="whitespace-nowrap rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Agregar
          </button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {puestos.map((p) => (
            <li key={p.id} className="rounded-md border border-slate-200 p-2 text-sm">
              {editando === p.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input className={inputClass} value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                  <select className={inputClass} value={editAreaId} onChange={(e) => setEditAreaId(e.target.value)}>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                  <button onClick={() => guardarEdicion(p.id)} className="text-sm font-medium text-brand-600 hover:underline">Guardar</button>
                  <button onClick={() => setEditando(null)} className="text-sm text-slate-500">Cancelar</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-700">{p.nombre}</span>
                    <span className="ml-2 text-xs text-slate-400">{p.area?.nombre ?? areas.find((a) => a.id === p.areaId)?.nombre}</span>
                    {!p.activo && <Badge color="gris">Inactivo</Badge>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => iniciarEdicion(p)} className="text-sm font-medium text-brand-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(p.id)} className="text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {puestos.length === 0 && <p className="text-sm text-slate-400">No hay puestos registrados.</p>}
        </ul>
      </div>
    </Modal>
  );
}

export function PersonasPage() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroAreaId, setFiltroAreaId] = useState("");
  const [filtroPuestoId, setFiltroPuestoId] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Persona | null>(null);
  const [gestionandoAreas, setGestionandoAreas] = useState(false);
  const [gestionandoPuestos, setGestionandoPuestos] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);

  function cargarCatalogos() {
    apiClient.get<Area[]>("/areas").then((res) => setAreas(res.data));
    apiClient.get<Puesto[]>("/puestos").then((res) => setPuestos(res.data));
  }
  useEffect(cargarCatalogos, []);

  const { items: personas, pagination, setPage, cargando, recargar } = usePaginatedList<Persona>("/personas", {
    q: busqueda,
    areaId: filtroAreaId,
    puestoId: filtroPuestoId,
    activo: filtroActivo,
  });

  const puestosDelFiltro = filtroAreaId ? puestos.filter((p) => p.areaId === filtroAreaId) : puestos;

  const columnas: Columna<Persona>[] = [
    { encabezado: "Nombre", render: (p) => `${p.nombre} ${p.apellido}` },
    { encabezado: "Email", render: (p) => p.email ?? "—" },
    { encabezado: "Área", render: (p) => p.area?.nombre ?? "—" },
    { encabezado: "Puesto", render: (p) => p.puesto?.nombre ?? "—" },
    {
      encabezado: "Estado",
      render: (p) => <Badge color={p.activo ? "verde" : "gris"}>{p.activo ? "Activo" : "Inactivo"}</Badge>,
    },
    {
      encabezado: "",
      render: (p) => (
        <button onClick={() => setEditando(p)} className="text-sm font-medium text-brand-600 hover:underline">
          Editar
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-800">Personas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setGestionandoAreas(true)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            Gestionar áreas
          </button>
          <button onClick={() => setGestionandoPuestos(true)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            Gestionar puestos
          </button>
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Nueva persona
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputClass} w-64`}
        />
        <select
          className={`${inputClass} w-auto`}
          value={filtroAreaId}
          onChange={(e) => {
            setFiltroAreaId(e.target.value);
            setFiltroPuestoId("");
          }}
        >
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
        <select className={`${inputClass} w-auto`} value={filtroPuestoId} onChange={(e) => setFiltroPuestoId(e.target.value)}>
          <option value="">Todos los puestos</option>
          {puestosDelFiltro.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <select className={`${inputClass} w-auto`} value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando personas...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={personas} vacio="No hay personas registradas." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nueva persona" onClose={() => setMostrarForm(false)}>
          <PersonaForm
            persona={null}
            areas={areas}
            puestos={puestos}
            onGuardado={() => {
              setMostrarForm(false);
              recargar();
            }}
            onCancelar={() => setMostrarForm(false)}
          />
        </Modal>
      )}

      {editando && (
        <Modal titulo="Editar persona" onClose={() => setEditando(null)}>
          <PersonaForm
            persona={editando}
            areas={areas}
            puestos={puestos}
            onGuardado={() => {
              setEditando(null);
              recargar();
            }}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}

      {gestionandoAreas && (
        <AreasManager
          onClose={() => setGestionandoAreas(false)}
          onCambio={() => {
            cargarCatalogos();
            recargar();
          }}
        />
      )}

      {gestionandoPuestos && (
        <PuestosManager
          areas={areas}
          onClose={() => setGestionandoPuestos(false)}
          onCambio={() => {
            cargarCatalogos();
            recargar();
          }}
        />
      )}
    </div>
  );
}
