import { useState } from "react";
import { DataTable, type Columna } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { Pagination } from "@/components/common/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import type { Persona } from "@/types";

export function PersonasPage() {
  const [busqueda, setBusqueda] = useState("");

  const { items: personas, pagination, setPage, cargando } = usePaginatedList<Persona>("/personas", {
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
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Personas</h1>
        <input
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando personas...</p>
      ) : (
        <>
          <DataTable columnas={columnas} filas={personas} vacio="No hay personas registradas." />
          {pagination && <Pagination meta={pagination} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
