# Paquete de datos — Productos Lácteos La Quinta (Norma Integrada v29 / MN-IMS-01)

Exportado el 09/11/2026 desde el sistema documental elaborado con TGE Consultoría
(carpeta `Norma Integrada`, Lista Maestra PR-IMS-01-F01 Rev 00).

| Archivo | Origen | Contenido |
|---|---|---|
| `areas.json` | MN-IMS-01 tabla 5.3-1 | 12 gerencias de la Norma (sigla, nombre, descripción) |
| `documentos.json` | PR-IMS-01-F01 Lista Maestra | 201 documentos: código, título, tipo, nivel, padre, gerencia L/P/A, cláusulas, evidencias Anexo B, carpeta, revisión, estado |
| `riesgos.json` | PR-IMS-06-F01 | 14 riesgos y oportunidades del sistema (P × I 1-5) |
| `objetivos.json` | PR-IMS-07-F01 | 8 objetivos 2027 con indicador, meta y plan |
| `indicadores.json` | PR-IMS-07-F02 | 153 indicadores definidos en los procedimientos |
| `auditoria_ai_2026_01.json` | PR-IMS-08-F02 | Auditoría documental AI-2026-01: 17 hallazgos (4 NC menores) |
| `comunicaciones.json` | PR-IMS-04-F02 | 249 interfaces entre gerencias (qué entrega / qué recibe / plazo) — pendiente de módulo |
| `requisitos.json` | PR-IMS-02-F01 | 100 requisitos legales, de esquema y de cliente con vigencia confirmada — pendiente de módulo |

Carga: `npm run db:seed` (roles/admin) y después `npm run db:seed:la-quinta`.
Crea un usuario responsable por gerencia (`gerente.<sigla>@laquinta.local`, contraseña `LaQuinta2026!`,
cambiar en producción) para poder asignar documentos, riesgos, objetivos e indicadores.
