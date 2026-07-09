import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import type { Paginated, PaginationMeta } from "@/types";

type Filtros = Record<string, string | boolean | undefined>;

/** Lista con filtros + paginación del lado del servidor, reutilizada por todas
 * las pantallas de listado (documentos, riesgos, NC, auditorías, indicadores,
 * proveedores, personas). Vuelve a la página 1 cada vez que cambian los filtros. */
export function usePaginatedList<T>(endpoint: string, filtros: Filtros, pageSize = 20) {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);

  const filtrosKey = JSON.stringify(filtros);

  function recargar() {
    setCargando(true);
    const merged: Record<string, unknown> = { ...filtros, page, pageSize };
    const params = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== "" && v !== undefined)
    );
    return apiClient
      .get<Paginated<T>>(endpoint, { params })
      .then((res) => {
        setItems(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey]);

  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, filtrosKey]);

  return { items, pagination, page, setPage, cargando, recargar };
}
