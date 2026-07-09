import { useState, type ChangeEvent } from "react";
import { apiClient } from "@/api/client";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/api\/?$/, "");

export function FileUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post<{ url: string; nombre: string }>(
        "/uploads",
        formData
      );
      onChange(data.url);
    } catch {
      setError("No se pudo subir el archivo (máx. 10MB; PDF, imagen, Word o Excel).");
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-1">
      <input
        type="file"
        onChange={handleFile}
        disabled={subiendo}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
      />
      {subiendo && <p className="text-xs text-slate-400">Subiendo...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {value && !subiendo && (
        <p className="text-xs text-slate-500">
          Archivo adjunto:{" "}
          <a
            href={`${API_ORIGIN}${value}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-600 hover:underline"
          >
            ver / descargar
          </a>{" "}
          ·{" "}
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-red-500 hover:underline"
          >
            quitar
          </button>
        </p>
      )}
    </div>
  );
}
