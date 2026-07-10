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
  onGuardado,
  onCancelar,
}: {
  persona: Persona | null;
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
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
    apiClient.get<Area[]>("/areas").then((res) => setAreas(res.data));
    apiClient.get<Puesto[]>("/puestos").then((res) => setPuestos(res.data));
  }, []);

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

export function PersonasPage() {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Persona | null>(null);

  const { items: personas, pagination, setPage, cargando, recargar } = usePaginatedList<Persona>("/personas", {
    q: busqueda,
  });

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Personas</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button onClick={() => setMostrarForm(true)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            + Nueva persona
          </button>
        </div>
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
            onGuardado={() => {
              setEditando(null);
              recargar();
            }}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}
    </div>
  );
}
