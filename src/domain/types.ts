/**
 * Tipos de dominio que usa la interfaz.
 *
 * Son el modelo que el frontend necesita para pintar cada módulo. No sustituyen
 * al modelo de datos oficial (listas SharePoint / Fabric): cuando ese modelo se
 * cierre, el adaptador productivo deberá mapearlo a estos tipos.
 */

export type View =
  | "inicio"
  | "bandeja"
  | "validacion"
  | "matriz"
  | "historico"
  | "conciliacion"
  | "layout"
  | "admin";

export type BonusStatus = "Cumple" | "Revisión" | "Falta evidencia" | "Aprobado" | "Rechazado";
export const BONUS_STATUSES: BonusStatus[] = ["Cumple", "Revisión", "Falta evidencia", "Aprobado", "Rechazado"];

export type MovementSource = "SharePoint" | "Correo";

/** Movimiento de bono capturado para un periodo. */
export interface Movement {
  id: string;
  /** Identificador de empleado tal como lo entregue el backend (cadena, nunca número). */
  employeeId: string;
  employeeName: string;
  /** Nombre del concepto de bono (ver catálogo de conceptos). */
  bonus: string;
  client: string;
  site: string;
  requested: number;
  calculated: number;
  hasSupport: boolean;
  status: BonusStatus;
  /** Días que exige la regla de asistencia (0 = no aplica). */
  attendanceDays: number;
  /** Días con asistencia coincidente. */
  attendanceMatched: number;
  source: MovementSource;
  /** Aprobado como excepción (sin soporte, con justificación). */
  exception?: boolean;
}

export type Role = "Super Admin" | "Admin" | "Usuario";
export const ROLES: Role[] = ["Super Admin", "Admin", "Usuario"];

export interface AppUser {
  id: string;
  displayName: string;
  role: Role;
}

export type PeriodStatus = "captura" | "entregado" | "validacion" | "cerrado";

export interface Period {
  id: string;
  /** Etiqueta corta mostrada en la barra superior, p. ej. "SEM II 38". */
  label: string;
  /** Título del periodo en el resumen, p. ej. "Semana 38". */
  title: string;
  /** Número de ronda / extensión vigente (1 = entrega original). */
  version: number;
  status: PeriodStatus;
  /** Texto de la fecha límite tal como lo calcule el backend. */
  deadlineLabel: string;
}

export type CompareRange = "Mes anterior" | "Trimestre" | "Semestre" | "Año";
export const COMPARE_RANGES: CompareRange[] = ["Mes anterior", "Trimestre", "Semestre", "Año"];

export interface ComparisonResult {
  reference: string;
  amount: number;
  previousAmount: number;
  movements: number;
  previousMovements: number;
  approved: number;
  previousApproved: number;
  categories: { name: string; current: number; previous: number }[];
}

export type Decision = "Aprobado" | "Revisión" | "Rechazado";

export type EvidenceType = "asistencia" | "matriz" | "soporte";

export interface AttendanceDay {
  day: string;
  observedSite: string | null;
  incident: string;
  matches: boolean;
}

export interface AttendanceEvidence {
  type: "asistencia";
  employeeId: string;
  site: string;
  requiredDays: number;
  matchedDays: number;
  days: AttendanceDay[];
}

export interface RuleEvidence {
  type: "matriz";
  bonus: string;
  scope: string;
  amountType: "NETO" | "BRUTO";
  validationRule: string;
  calculated: number;
  /** Versión de la matriz aplicada, cuando el backend la exponga. */
  matrixVersion?: string;
}

export interface SupportEvidence {
  type: "soporte";
  documents: { id: string; fileName: string; description: string; url?: string }[];
}

export type Evidence = AttendanceEvidence | RuleEvidence | SupportEvidence;

export interface BonusRule {
  id: string;
  bonus: string;
  scope: string;
  amountType: "NETO" | "BRUTO";
  periodicity: string;
  validation: string;
  status: BonusStatus;
}

export interface ReconciliationSummary {
  detected: number;
  registered: number;
  delivered: number;
  withSupport: number;
  /** Entregadas consideradas para el indicador de respaldo. */
  supportBase: number;
  pending: { count: number; description: string }[];
}

export interface HumanLayoutPreview {
  approved: number;
  excluded: number;
  suggestedLot: string;
  /** Descripción de la estructura (la define el generador HUMAN, no el frontend). */
  structureLabel: string;
  encodingLabel: string;
  /** Líneas de muestra ya formateadas por el backend. */
  previewLines: string[];
}

export interface DashboardSummary {
  totalMovements: number;
  amount: number;
  needsReview: number;
  withSupport: number;
  sampleSize: number;
  differences: number;
  missingSupport: number;
}
