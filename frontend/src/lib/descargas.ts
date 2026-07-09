import { apiClient } from "@/api/client";

/** Descarga un archivo protegido por auth (el navegador no puede mandar el
 * header Authorization con un <a href> normal, así que se pide como blob). */
export async function descargarArchivo(
  endpoint: string,
  params: Record<string, string | undefined>,
  nombreSugerido: string
) {
  const filtros = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const res = await apiClient.get(endpoint, { params: filtros, responseType: "blob" });

  const disposition = res.headers["content-disposition"] as string | undefined;
  const nombreDelServidor = disposition?.match(/filename="(.+)"/)?.[1];

  const url = window.URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreDelServidor ?? nombreSugerido;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
