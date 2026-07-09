const ESTILOS: Record<string, string> = {
  gris: "bg-slate-100 text-slate-700",
  azul: "bg-blue-100 text-blue-700",
  verde: "bg-emerald-100 text-emerald-700",
  amarillo: "bg-amber-100 text-amber-700",
  rojo: "bg-red-100 text-red-700",
};

export function Badge({ children, color = "gris" }: { children: React.ReactNode; color?: keyof typeof ESTILOS }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS[color]}`}>
      {children}
    </span>
  );
}
