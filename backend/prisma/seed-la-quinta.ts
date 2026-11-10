/**
 * Seed de datos de Productos Lácteos La Quinta — Sistema de Gestión Integral (Norma Integrada v29 / MN-IMS-01).
 *
 * Carga el paquete documental generado con TGE Consultoría (Lista Maestra PR-IMS-01-F01, matriz de riesgos
 * PR-IMS-06-F01, objetivos PR-IMS-07-F01, indicadores de los procedimientos, auditoría documental AI-2026-01
 * y requisitos legales PR-IMS-02-F01) desde los JSON de prisma/data/la-quinta/.
 *
 * Idempotente: usa upsert por clave natural (sigla de área, código de documento, código de objetivo, etc.).
 * Requiere haber corrido antes `npm run db:seed` (roles y admin).
 *
 *   npx tsx prisma/seed-la-quinta.ts
 */
import { PrismaClient, EstadoDocumento, FrecuenciaIndicador, DireccionIndicador, TipoHallazgo } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const DATA = path.join(__dirname, "data", "la-quinta");
const read = <T>(f: string): T => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf-8")) as T;
/** Fecha ISO válida → Date; vacío, "SD" (sin dato) o texto no parseable → null. */
const fechaValida = (v: string | null | undefined): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

type AreaJ = { sigla: string; nombre: string; descripcion: string };
type DocJ = {
  codigo: string; titulo: string; tipo: string; nivel: number | null; padre: string | null; area: string;
  lidera: string | null; participa: string | null; autoriza: string | null; clausulas: string | null;
  evidencias: string | null; critico: string | null; carpeta: string | null; rev: string | null; estado: string | null;
  fechaEmision: string | null; proximaRevision: string | null; observacion: string | null;
};
type RiesgoJ = { n: number; tipo: string; fuente: string; dueno: string; descripcion: string; consecuencia: string; probabilidad: number; impacto: number; tratamiento: string; controles: string };
type ObjJ = { codigo: string; sistema: string; objetivo: string; indicador: string; unidad: string; meta: string; responsable: string; plazo: string; plan: string };
type KpiJ = { procedimiento: string; indicador: string; formula: string; meta: string; frecuencia: string };
type HallJ = { n: string; area: string; clausula: string; clasificacion: string; descripcion: string; causa: string; accion: string; responsable: string; folioNC: string | null };
type ReqJ = { tipo: string; sistema: string; requisito: string; fuente: string; apartado: string; cumplimiento: string; evidencia: string | null; area: string; dueno: string; vigor: string | null; confirmacion: string };
type ComJ = { procedimiento: string; titulo: string; area: string; entrega: string; recibe: string; plazo: string };
type EsqJ = { esquema: string; referencia: string; clausula: string };
type AudJ = { codigo: string; fecha: string; alcance: string; lider: string; resumen: string; hallazgos: HallJ[] };

// Sigla usada en los códigos (MFG, SD, RD) ↔ sigla corta usada en textos (Mfg, S&D, R&D)
const SIGLA_TEXTO: Record<string, string> = { CEO: "CEO", IMS: "IMS", QMS: "QMS", FS: "FS", QC: "QC", EHS: "EHS", PFM: "PFM", MFG: "Mfg", HR: "HR", SCM: "SCM", SD: "S&D", RD: "R&D" };
const TEXTO_SIGLA: Record<string, string> = Object.fromEntries(Object.entries(SIGLA_TEXTO).map(([k, v]) => [v, k]));
const areaDeCodigo = (codigo: string) => codigo.split("-")[1];

function nivelRiesgo(p: number) {
  return p > 15 ? "CRITICO" : p > 10 ? "ALTO" : p > 5 ? "MODERADO" : "BAJO";
}
function frecuencia(txt: string): FrecuenciaIndicador {
  const t = (txt || "").toLowerCase();
  if (t.includes("diari")) return "DIARIA";
  if (t.includes("seman")) return "SEMANAL";
  if (t.includes("trimes")) return "TRIMESTRAL";
  if (t.includes("semes")) return "SEMESTRAL";
  if (t.includes("anual") || t.includes("bienal")) return "ANUAL";
  return "MENSUAL";
}
function metaNumerica(txt: string): { meta: number; direccion: DireccionIndicador; unidad?: string } {
  const t = (txt || "").replace(",", ".");
  const m = t.match(/(\d+(?:\.\d+)?)/);
  const meta = m ? parseFloat(m[1]) : 0;
  const direccion: DireccionIndicador = /≤|<|máx|max|cero|^0\b|\b0\b|reduc|menor/i.test(t) ? "MENOR_ES_MEJOR" : "MAYOR_ES_MEJOR";
  const unidad = t.includes("%") ? "%" : t.match(/d[ií]as?/i) ? "días" : t.match(/horas?/i) ? "h" : undefined;
  return { meta, direccion, unidad };
}

async function main() {
  const rolResponsable = await prisma.rol.findUniqueOrThrow({ where: { nombre: "RESPONSABLE_PROCESO" } });
  const rolAuditor = await prisma.rol.findUniqueOrThrow({ where: { nombre: "AUDITOR" } });
  const admin = await prisma.usuario.findFirstOrThrow({ where: { rol: { nombre: "ADMIN" } } });
  const passwordHash = await bcrypt.hash("LaQuinta2026!", 10);

  // 1. Áreas (gerencias de la Norma) + usuario responsable por gerencia + proceso por gerencia
  console.log("Áreas, usuarios y procesos por gerencia...");
  const areas = read<AreaJ[]>("areas.json");
  const areaId: Record<string, string> = {};
  const userId: Record<string, string> = {};
  const procesoId: Record<string, string> = {};
  for (const a of areas) {
    const area = await prisma.area.upsert({ where: { nombre: a.nombre }, update: { descripcion: a.descripcion }, create: { nombre: a.nombre, descripcion: a.descripcion } });
    areaId[a.sigla] = area.id;
    const email = `gerente.${a.sigla.toLowerCase()}@laquinta.local`;
    const u = await prisma.usuario.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, nombre: `Gerente ${a.nombre}`, rolId: a.sigla === "IMS" ? rolAuditor.id : rolResponsable.id },
    });
    userId[a.sigla] = u.id;
    const existente = await prisma.proceso.findFirst({ where: { nombre: a.nombre, areaId: area.id } });
    const proc = existente ?? (await prisma.proceso.create({ data: { nombre: a.nombre, areaId: area.id, responsableId: u.id } }));
    procesoId[a.sigla] = proc.id;
  }

  // 2. Tipos de documento
  console.log("Tipos de documento...");
  const tipos = ["Manual", "Política", "Procedimiento", "Criterios mínimos de área", "Anexo / programa / plan", "Instructivo", "Formato / matriz / herramienta"];
  const tipoId: Record<string, string> = {};
  for (const t of tipos) {
    const r = await prisma.tipoDocumento.upsert({ where: { nombre: t }, update: {}, create: { nombre: t } });
    tipoId[t] = r.id;
  }

  // 3. Documentos (Lista Maestra) — padres primero, luego hijos
  console.log("Documentos de la Lista Maestra...");
  const docs = read<DocJ[]>("documentos.json");
  const ordenados = [...docs].sort((a, b) => (a.padre ? 1 : 0) - (b.padre ? 1 : 0));
  const docId: Record<string, string> = {};
  let n = 0;
  for (const d of ordenados) {
    const sigla = areaDeCodigo(d.codigo);
    const estado: EstadoDocumento = d.estado === "Emitido" ? "APROBADO" : d.estado === "En revisión" ? "EN_REVISION" : "BORRADOR";
    const tipo = tipoId[d.tipo] ?? tipoId["Formato / matriz / herramienta"];
    const data = {
      titulo: d.titulo,
      tipoDocumentoId: tipo,
      areaId: areaId[sigla] ?? areaId["IMS"],
      responsableId: userId[sigla] ?? userId["IMS"],
      estado,
      documentoPadreId: d.padre ? docId[d.padre] ?? null : null,
      nivel: d.nivel ?? null,
      revision: d.rev ? String(d.rev).padStart(2, "0") : "00",
      clausulas: d.clausulas ? String(d.clausulas) : null,
      evidencias: d.evidencias ? String(d.evidencias) : null,
      participa: d.participa,
      autoriza: d.autoriza,
      carpeta: d.carpeta,
      critico: d.critico === "Sí",
      proximaRevision: d.proximaRevision ? new Date(d.proximaRevision) : null,
    };
    const doc = await prisma.documento.upsert({ where: { codigo: d.codigo }, update: data, create: { codigo: d.codigo, ...data } });
    docId[d.codigo] = doc.id;
    const v = await prisma.versionDocumento.findFirst({ where: { documentoId: doc.id, numeroVersion: 1 } });
    if (!v) {
      await prisma.versionDocumento.create({
        data: { documentoId: doc.id, numeroVersion: 1, estado, creadoPorId: userId[sigla] ?? admin.id, cambios: d.observacion ?? "Emisión inicial Rev 00" },
      });
    }
    n++;
  }
  console.log(`  ${n} documentos`);

  // 4. Riesgos y oportunidades del sistema (PR-IMS-06-F01)
  console.log("Riesgos y oportunidades...");
  const catSistema = await prisma.categoriaRiesgo.upsert({ where: { nombre: "Sistema de gestión" }, update: {}, create: { nombre: "Sistema de gestión", descripcion: "Riesgos del contexto, partes interesadas, procesos y recursos (PR-IMS-06)" } });
  const catOport = await prisma.categoriaRiesgo.upsert({ where: { nombre: "Oportunidad" }, update: {}, create: { nombre: "Oportunidad", descripcion: "Oportunidades de mejora del sistema (PR-IMS-06)" } });
  for (const r of read<RiesgoJ[]>("riesgos.json")) {
    const sigla = TEXTO_SIGLA[r.dueno] ?? r.dueno;
    const puntaje = r.probabilidad * r.impacto;
    const codigo = `RS-2026-${String(r.n).padStart(2, "0")}`;
    await prisma.riesgo.upsert({
      where: { codigo },
      update: {},
      create: {
        codigo,
        descripcion: `${r.descripcion} — Consecuencia/beneficio: ${r.consecuencia} (fuente: ${r.fuente})`,
        procesoId: procesoId[sigla] ?? procesoId["IMS"],
        categoriaId: r.tipo === "Oportunidad" ? catOport.id : catSistema.id,
        probabilidad: r.probabilidad,
        impacto: r.impacto,
        puntajeRiesgo: puntaje,
        nivelRiesgo: nivelRiesgo(puntaje),
        controlesExistentes: `${r.tratamiento}: ${r.controles}`,
        responsableId: userId[sigla] ?? userId["IMS"],
        estado: "IDENTIFICADO",
      },
    });
  }

  // 5. Objetivos 2027 (PR-IMS-07-F01) con su plan
  console.log("Objetivos 2027...");
  for (const o of read<ObjJ[]>("objetivos.json")) {
    const sigla = TEXTO_SIGLA[o.responsable] ?? o.responsable;
    const nombre = `${o.codigo} · ${o.objetivo}`;
    const existente = await prisma.objetivo.findFirst({ where: { nombre } });
    if (existente) continue;
    const obj = await prisma.objetivo.create({
      data: {
        nombre,
        descripcion: `Sistema: ${o.sistema}. Indicador: ${o.indicador} (${o.unidad}). Meta: ${o.meta}.`,
        tipo: "ESTRATEGICO",
        areaId: areaId[sigla] ?? areaId["IMS"],
        responsableId: userId[sigla] ?? userId["IMS"],
        fechaInicio: new Date("2027-01-01"),
        fechaFin: new Date(o.plazo),
        estado: "PLANEADO",
      },
    });
    await prisma.plan.create({
      data: { objetivoId: obj.id, nombre: `Plan ${o.codigo}`, descripcion: o.plan, responsableId: userId[sigla] ?? userId["IMS"], fechaInicio: new Date("2027-01-01"), fechaFin: new Date(o.plazo) },
    });
  }

  // 6. Indicadores de los procedimientos (PR-IMS-07-F02)
  console.log("Indicadores...");
  let k = 0;
  for (const i of read<KpiJ[]>("indicadores.json")) {
    const sigla = areaDeCodigo(i.procedimiento);
    const nombre = `${i.procedimiento} · ${i.indicador}`;
    const existente = await prisma.indicador.findFirst({ where: { nombre } });
    if (existente) continue;
    const { meta, direccion, unidad } = metaNumerica(i.meta);
    await prisma.indicador.create({
      data: {
        nombre,
        descripcion: `Meta del procedimiento: ${i.meta}`,
        formula: i.formula,
        frecuencia: frecuencia(i.frecuencia),
        meta,
        unidad,
        direccion,
        procesoId: procesoId[sigla] ?? null,
        responsableId: userId[sigla] ?? userId["IMS"],
      },
    });
    k++;
  }
  console.log(`  ${k} indicadores`);

  // 7. Auditoría documental AI-2026-01 con hallazgos; las NC menores generan No Conformidad
  console.log("Auditoría AI-2026-01...");
  const aud = read<AudJ>("auditoria_ai_2026_01.json");
  const programa = await prisma.programaAuditoria.findFirst({ where: { anio: 2026 } }) ??
    (await prisma.programaAuditoria.create({ data: { anio: 2026, nombre: "Programa 2026 — etapa documental", descripcion: "Auditoría documental previa a la implementación (PR-IMS-08)" } }));
  let auditoria = await prisma.auditoria.findFirst({ where: { alcance: { startsWith: aud.codigo } } });
  if (!auditoria) {
    auditoria = await prisma.auditoria.create({
      data: {
        programaId: programa.id, tipo: "INTERNA", alcance: `${aud.codigo} — ${aud.alcance}`,
        fechaInicio: new Date(aud.fecha), fechaFin: new Date(aud.fecha), liderAuditorId: userId["IMS"], equipoAuditor: aud.lider, estado: "FINALIZADA",
      },
    });
    await prisma.informeAuditoria.create({ data: { auditoriaId: auditoria.id, resumen: aud.resumen, conclusiones: "Sin NC mayores. 4 NC menores con plazo 60 días; observaciones antes de la preauditoría." } });
    for (const h of aud.hallazgos) {
      const sigla = TEXTO_SIGLA[h.area] ?? (h.area === "Todas" ? "IMS" : h.area);
      const tipo: TipoHallazgo = h.clasificacion.startsWith("NC") ? "NO_CONFORMIDAD" : h.clasificacion === "Observación" ? "OBSERVACION" : "OPORTUNIDAD_MEJORA";
      let ncId: string | undefined;
      if (h.folioNC) {
        const nc = await prisma.noConformidad.upsert({
          where: { codigo: h.folioNC },
          update: {},
          create: {
            codigo: h.folioNC, origen: "AUDITORIA", descripcion: `${h.n} (${h.clausula}): ${h.descripcion}`, procesoId: procesoId[sigla] ?? null,
            causaRaiz: h.causa, responsableId: userId[sigla] ?? userId["IMS"], fechaDeteccion: new Date(aud.fecha), fechaCompromiso: new Date("2027-01-08"), estado: "ACCION_DEFINIDA",
          },
        });
        await prisma.accionNC.create({ data: { noConformidadId: nc.id, descripcion: h.accion, tipo: "CORRECTIVA", responsableId: userId[sigla] ?? userId["IMS"], fechaCompromiso: new Date("2027-01-08") } });
        ncId = nc.id;
      }
      await prisma.hallazgo.create({
        data: { auditoriaId: auditoria.id, tipo, descripcion: `${h.n} · ${h.clausula} · ${h.clasificacion}: ${h.descripcion} — Acción: ${h.accion}`, procesoId: procesoId[sigla] ?? null, noConformidadId: ncId, responsableId: userId[sigla] ?? userId["IMS"] },
      });
    }
  }
  // 8. Requisitos legales, de esquema y de cliente (PR-IMS-02-F01)
  console.log("Requisitos legales, de esquema y de cliente...");
  const tipoReq = (t: string) => (t === "Legal" ? "LEGAL" : t === "Esquema" || t === "Esquema GFSI" ? "ESQUEMA" : t === "Cliente" || t === "Tiendas 3B" ? "CLIENTE" : "OTRO");
  let nr = 0;
  for (const r of read<ReqJ[]>("requisitos.json")) {
    const existente = await prisma.requisito.findFirst({ where: { requisito: r.requisito, deletedAt: null } });
    if (existente) continue;
    const sigla = TEXTO_SIGLA[r.area] ?? r.area;
    await prisma.requisito.create({
      data: {
        tipo: tipoReq(r.tipo), sistema: r.sistema, requisito: r.requisito, fuente: r.fuente, apartado: r.apartado,
        comoSeCumple: r.cumplimiento, documentos: r.evidencia ?? undefined,
        areaId: areaId[sigla] ?? null, responsableId: userId[TEXTO_SIGLA[r.dueno] ?? r.dueno] ?? null,
        fechaVigor: fechaValida(r.vigor), vigenciaConfirmada: r.confirmacion,
        estado: "POR_EVALUAR", proximaEvaluacion: new Date("2026-12-15"),
      },
    });
    nr++;
  }
  console.log(`  ${nr} requisitos`);

  // 9. Matriz de comunicación entre gerencias (PR-IMS-04-F02)
  console.log("Matriz de comunicación...");
  const areaPorTexto = (txt: string): string | null => {
    for (const [sig, nombre] of Object.entries(SIGLA_TEXTO)) {
      if (txt.includes(`(${sig})`) || txt.includes(`(${nombre})`) || txt === sig || txt === nombre) return areaId[sig] ?? null;
    }
    for (const a of areas) if (txt.includes(a.nombre)) return areaId[a.sigla];
    return null;
  };
  let nc = 0;
  for (const c of read<ComJ[]>("comunicaciones.json")) {
    const duena = areaId[areaDeCodigo(c.procedimiento)];
    if (!duena) continue;
    const existente = await prisma.comunicacionInterfaz.findFirst({ where: { documentoCodigo: c.procedimiento, contraparteTexto: c.area, entrega: c.entrega ?? undefined, deletedAt: null } });
    if (existente) continue;
    await prisma.comunicacionInterfaz.create({
      data: { documentoCodigo: c.procedimiento, documentoTitulo: c.titulo, areaDuenaId: duena, areaContraparteId: areaPorTexto(c.area), contraparteTexto: c.area, entrega: c.entrega, recibe: c.recibe, plazo: c.plazo },
    });
    nc++;
  }
  console.log(`  ${nc} interfaces`);

  // 10. Referencias de esquemas ↔ cláusulas (paquete por esquema PR-IMS-08-A02)
  console.log("Referencias de esquemas...");
  let ne = 0;
  for (const e of read<EsqJ[]>("esquemas.json")) {
    await prisma.esquemaReferencia.upsert({ where: { esquema_referencia_clausula: { esquema: e.esquema, referencia: e.referencia, clausula: e.clausula } }, update: {}, create: e });
    ne++;
  }
  console.log(`  ${ne} referencias`);

  console.log("Listo. Usuarios por gerencia: gerente.<sigla>@laquinta.local / LaQuinta2026! (cambiar en producción).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
