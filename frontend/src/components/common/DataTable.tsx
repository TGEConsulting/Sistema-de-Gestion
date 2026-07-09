export interface Columna<T> {
  encabezado: string;
  render: (fila: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  columnas,
  filas,
  vacio = "Sin registros",
}: {
  columnas: Columna<T>[];
  filas: T[];
  vacio?: string;
}) {
  if (filas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
        {vacio}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columnas.map((col) => (
              <th key={col.encabezado} className="px-4 py-2 text-left font-medium text-slate-500">
                {col.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map((fila) => (
            <tr key={fila.id} className="hover:bg-slate-50">
              {columnas.map((col) => (
                <td key={col.encabezado} className="px-4 py-2 text-slate-700">
                  {col.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
