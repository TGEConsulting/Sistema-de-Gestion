import ExcelJS from "exceljs";
import type { Response } from "express";

export interface ColumnaExcel<T> {
  encabezado: string;
  ancho?: number;
  valor: (fila: T) => string | number | Date | null | undefined;
}

/** Construye un .xlsx en memoria y lo envía como descarga. Pensado para
 * listados de tamaño moderado (unos miles de filas); no pagina. */
export async function enviarExcel<T>(
  res: Response,
  nombreArchivo: string,
  nombreHoja: string,
  columnas: ColumnaExcel<T>[],
  filas: T[]
) {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet(nombreHoja);

  hoja.columns = columnas.map((c) => ({ header: c.encabezado, width: c.ancho ?? 22 }));
  hoja.getRow(1).font = { bold: true };

  for (const fila of filas) {
    hoja.addRow(columnas.map((c) => c.valor(fila) ?? ""));
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}"`);

  await workbook.xlsx.write(res);
  res.end();
}
