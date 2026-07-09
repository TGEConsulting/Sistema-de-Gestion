import type { PaginationMeta } from "@/types";

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;

  const inicio = (meta.page - 1) * meta.pageSize + 1;
  const fin = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-2 py-3 text-sm text-slate-500">
      <span>
        {inicio}–{fin} de {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          className="rounded-md border border-slate-200 px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span>
          Página {meta.page} de {meta.totalPages}
        </span>
        <button
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          className="rounded-md border border-slate-200 px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
