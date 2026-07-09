import PDFDocument from "pdfkit";
import type { Response } from "express";

interface InformeAuditoriaPdfData {
  id: string;
  tipo: string;
  alcance: string;
  fechaInicio: Date;
  fechaFin: Date;
  liderAuditor: { nombre: string };
  hallazgos: { tipo: string; descripcion: string }[];
  informe: { resumen: string; conclusiones: string | null; fechaEmision: Date } | null;
}

export function enviarInformeAuditoriaPdf(res: Response, auditoria: InformeAuditoriaPdfData) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="informe-auditoria-${auditoria.id}.pdf"`
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).text("Informe de Auditoría", { align: "center" });
  doc.moveDown(1.5);

  doc.fontSize(11);
  doc.text(`Tipo: ${auditoria.tipo}`);
  doc.text(`Alcance: ${auditoria.alcance}`);
  doc.text(
    `Periodo: ${auditoria.fechaInicio.toLocaleDateString()} – ${auditoria.fechaFin.toLocaleDateString()}`
  );
  doc.text(`Líder auditor: ${auditoria.liderAuditor.nombre}`);
  if (auditoria.informe) {
    doc.text(`Fecha de emisión: ${auditoria.informe.fechaEmision.toLocaleDateString()}`);
  }
  doc.moveDown();

  doc.fontSize(14).text("Resumen", { underline: true });
  doc.fontSize(11).text(auditoria.informe?.resumen ?? "Sin resumen registrado.");
  doc.moveDown();

  if (auditoria.informe?.conclusiones) {
    doc.fontSize(14).text("Conclusiones", { underline: true });
    doc.fontSize(11).text(auditoria.informe.conclusiones);
    doc.moveDown();
  }

  doc.fontSize(14).text("Hallazgos", { underline: true });
  if (auditoria.hallazgos.length === 0) {
    doc.fontSize(11).text("Sin hallazgos registrados.");
  } else {
    auditoria.hallazgos.forEach((h, i) => {
      doc.fontSize(11).text(`${i + 1}. [${h.tipo}] ${h.descripcion}`);
    });
  }

  doc.end();
}
