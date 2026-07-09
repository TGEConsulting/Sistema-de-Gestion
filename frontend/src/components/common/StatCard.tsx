export function StatCard({
  titulo,
  valor,
  subtitulo,
  color = "azul",
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  color?: "azul" | "verde" | "amarillo" | "rojo";
}) {
  const barras: Record<string, string> = {
    azul: "border-l-brand-500",
    verde: "border-l-emerald-500",
    amarillo: "border-l-amber-500",
    rojo: "border-l-red-500",
  };

  return (
    <div className={`rounded-lg border border-l-4 bg-white p-4 shadow-sm ${barras[color]}`}>
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valor}</p>
      {subtitulo && <p className="mt-1 text-xs text-slate-400">{subtitulo}</p>}
    </div>
  );
}
