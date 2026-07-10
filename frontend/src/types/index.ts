export type NombreRol = "ADMIN" | "AUDITOR" | "RESPONSABLE_PROCESO" | "LECTURA";

export type ModuloSistema =
  | "DOCUMENTOS"
  | "OBJETIVOS"
  | "RIESGOS"
  | "NO_CONFORMIDADES"
  | "AUDITORIAS"
  | "INDICADORES"
  | "PERSONAS"
  | "PROVEEDORES"
  | "COMUNICACIONES";

export type NivelPermiso = "NINGUNO" | "VER" | "EDITAR" | "APROBAR";

export interface PermisoModuloItem {
  modulo: ModuloSistema;
  nivel: NivelPermiso;
}

export interface FilaPermisosRol {
  rolId: string;
  rol: NombreRol;
  permisos: PermisoModuloItem[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  rol: NombreRol;
}

export interface ResultadoBusqueda {
  tipo: "Documento" | "Riesgo" | "NoConformidad" | "Auditoria" | "Proveedor";
  id: string;
  titulo: string;
  subtitulo: string;
  ruta: string;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  origenTipo: string | null;
  origenId: string | null;
  fechaVencimiento: string | null;
  estado: "PENDIENTE" | "EN_PROCESO" | "COMPLETADA" | "VENCIDA";
}

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  tareasPendientes: Tarea[];
  notificacionesNoLeidas: Notificacion[];
  documentosPorEstado: { estado: string; total: number }[];
  noConformidadesPorEstado: { estado: string; total: number }[];
  riesgosPorNivel: { nivel: string; total: number }[];
  proximasAuditorias: { id: string; alcance: string; fechaInicio: string }[];
  semaforoIndicadores: { VERDE: number; AMARILLO: number; ROJO: number; SIN_DATOS: number };
}

export interface Area {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Puesto {
  id: string;
  nombre: string;
  areaId: string;
  area?: Area;
  activo: boolean;
}

export interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  areaId: string | null;
  puestoId: string | null;
  area?: Area | null;
  puesto?: Puesto | null;
  activo: boolean;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: NombreRol;
  activo: boolean;
  personaId: string | null;
}

export interface RefNombre {
  id: string;
  nombre: string;
}

export type EstadoDocumento = "BORRADOR" | "EN_REVISION" | "APROBADO" | "OBSOLETO";

export interface TipoDocumento {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface VersionDocumento {
  id: string;
  numeroVersion: number;
  estado: EstadoDocumento;
  cambios: string | null;
  archivoUrl: string | null;
  creadoPor: RefNombre;
  aprobadoPor: RefNombre | null;
  fechaAprobacion: string | null;
  createdAt: string;
}

export interface Documento {
  id: string;
  codigo: string;
  titulo: string;
  estado: EstadoDocumento;
  tipoDocumentoId: string;
  tipoDocumento?: TipoDocumento;
  areaId: string;
  area?: Area;
  responsableId: string;
  responsable?: RefNombre;
  proximaRevision: string | null;
  versionVigente?: VersionDocumento | null;
  versiones?: VersionDocumento[];
}

export type EstadoObjetivo = "PLANEADO" | "EN_PROCESO" | "LOGRADO" | "NO_LOGRADO" | "CANCELADO";
export type EstadoActividad = "PENDIENTE" | "EN_PROCESO" | "COMPLETADA" | "ATRASADA";

export interface Actividad {
  id: string;
  planId: string;
  nombre: string;
  descripcion: string | null;
  responsable?: RefNombre;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoActividad;
  avancePorcentaje: number;
}

export interface Plan {
  id: string;
  objetivoId: string;
  nombre: string;
  descripcion: string | null;
  responsable?: RefNombre;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoObjetivo;
  actividades?: Actividad[];
}

export interface Objetivo {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: "ESTRATEGICO" | "OPERATIVO";
  areaId: string;
  area?: Area;
  responsable?: RefNombre;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoObjetivo;
  planes?: Plan[];
}

export type NivelRiesgo = "BAJO" | "MODERADO" | "ALTO" | "CRITICO";
export type EstadoRiesgo = "IDENTIFICADO" | "EN_TRATAMIENTO" | "MITIGADO" | "CERRADO";
export type EstadoTratamiento = "PENDIENTE" | "EN_PROCESO" | "IMPLEMENTADO" | "VERIFICADO";

export interface PlanTratamientoRiesgo {
  id: string;
  descripcion: string;
  responsable?: RefNombre;
  fechaCompromiso: string;
  estado: EstadoTratamiento;
  evidenciaUrl: string | null;
}

export interface Riesgo {
  id: string;
  codigo: string;
  descripcion: string;
  procesoId: string;
  proceso?: RefNombre;
  categoriaId: string;
  categoria?: RefNombre;
  probabilidad: number;
  impacto: number;
  puntajeRiesgo: number;
  nivelRiesgo: NivelRiesgo;
  controlesExistentes: string | null;
  responsable?: RefNombre;
  estado: EstadoRiesgo;
  planesTratamiento?: PlanTratamientoRiesgo[];
}

export type OrigenNC = "AUDITORIA" | "RECLAMO" | "INCIDENTE" | "INSPECCION" | "AUTOEVALUACION";
export type EstadoNC =
  | "ABIERTA"
  | "EN_ANALISIS"
  | "ACCION_DEFINIDA"
  | "EN_IMPLEMENTACION"
  | "CERRADA"
  | "INEFICAZ";
export type TipoAccion = "INMEDIATA" | "CORRECTIVA" | "PREVENTIVA";
export type EstadoAccion = "PENDIENTE" | "EN_PROCESO" | "COMPLETADA" | "VENCIDA";

export interface AccionNC {
  id: string;
  descripcion: string;
  tipo: TipoAccion;
  responsable?: RefNombre;
  fechaCompromiso: string;
  fechaCierre: string | null;
  estado: EstadoAccion;
  evidenciaUrl: string | null;
}

export interface NoConformidad {
  id: string;
  codigo: string;
  origen: OrigenNC;
  descripcion: string;
  procesoId: string | null;
  proceso?: RefNombre | null;
  causaRaiz: string | null;
  responsableId: string;
  responsable?: RefNombre;
  fechaDeteccion: string;
  fechaCompromiso: string | null;
  estado: EstadoNC;
  evidenciaCierre: string | null;
  acciones?: AccionNC[];
}

export type TipoAuditoria = "INTERNA" | "EXTERNA" | "CERTIFICACION";
export type EstadoAuditoria = "PROGRAMADA" | "EN_EJECUCION" | "FINALIZADA" | "CANCELADA";
export type RespuestaChecklist = "CUMPLE" | "NO_CUMPLE" | "NO_APLICA" | "PENDIENTE";
export type TipoHallazgo = "NO_CONFORMIDAD" | "OBSERVACION" | "OPORTUNIDAD_MEJORA" | "FORTALEZA";

export interface ProgramaAuditoria {
  id: string;
  anio: number;
  nombre: string;
  descripcion: string | null;
}

export interface PreguntaChecklist {
  id: string;
  texto: string;
  respuesta: RespuestaChecklist;
  observaciones: string | null;
  evidenciaUrl: string | null;
}

export interface Checklist {
  id: string;
  nombre: string;
  preguntas: PreguntaChecklist[];
}

export interface Hallazgo {
  id: string;
  tipo: TipoHallazgo;
  descripcion: string;
  proceso?: RefNombre | null;
  responsable?: RefNombre | null;
  noConformidad?: { id: string; codigo: string } | null;
}

export interface InformeAuditoria {
  id: string;
  resumen: string;
  conclusiones: string | null;
  archivoUrl: string | null;
  fechaEmision: string;
}

export interface Auditoria {
  id: string;
  programaId: string | null;
  programa?: ProgramaAuditoria | null;
  tipo: TipoAuditoria;
  alcance: string;
  fechaInicio: string;
  fechaFin: string;
  liderAuditor?: RefNombre;
  equipoAuditor: string | null;
  estado: EstadoAuditoria;
  checklists?: Checklist[];
  hallazgos?: Hallazgo[];
  informe?: InformeAuditoria | null;
}

export type FrecuenciaIndicador = "DIARIA" | "SEMANAL" | "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
export type DireccionIndicador = "MAYOR_ES_MEJOR" | "MENOR_ES_MEJOR";
export type SemaforoIndicador = "VERDE" | "AMARILLO" | "ROJO";

export interface RegistroIndicador {
  id: string;
  valor: number;
  fecha: string;
  observaciones: string | null;
}

export interface Indicador {
  id: string;
  nombre: string;
  descripcion: string | null;
  formula: string | null;
  frecuencia: FrecuenciaIndicador;
  meta: number;
  unidad: string | null;
  direccion: DireccionIndicador;
  proceso?: RefNombre | null;
  responsable?: RefNombre;
  activo: boolean;
  ultimoValor?: number | null;
  ultimaFecha?: string | null;
  semaforo?: SemaforoIndicador | null;
  registros?: RegistroIndicador[];
}

export type TipoProveedor = "INSUMOS" | "SERVICIOS" | "TRANSPORTE" | "MAQUINARIA" | "OTRO";
export type EstadoProveedor = "EN_EVALUACION" | "ACTIVO" | "SUSPENDIDO" | "INACTIVO";

export interface EvaluacionProveedor {
  id: string;
  fecha: string;
  puntuacion: number;
  resultado: string | null;
  evaluadoPor?: RefNombre;
}

export interface DocumentoProveedor {
  id: string;
  nombre: string;
  archivoUrl: string | null;
  fechaVencimiento: string | null;
}

export interface Proveedor {
  id: string;
  nombre: string;
  taxId: string | null;
  tipo: TipoProveedor;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  estado: EstadoProveedor;
  evaluaciones?: EvaluacionProveedor[];
  documentos?: DocumentoProveedor[];
}
