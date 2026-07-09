export function EmptyModulePage({ titulo, fase }: { titulo: string; fase: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-slate-700">{titulo}</h2>
      <p className="mt-2 text-sm text-slate-400">
        El modelo de datos y la API ya están listos para este módulo. La pantalla completa se
        construye en {fase}.
      </p>
    </div>
  );
}
