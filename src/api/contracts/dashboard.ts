/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { CompareRange, ComparisonResult, DashboardSummary } from "../../domain/types";

export interface DashboardApi {
  /** Indicadores del módulo Resumen para el periodo. */
  getSummary(periodId: string): Promise<DashboardSummary>;
  /** Periodos que se pueden usar como base del comparativo (etiquetas). */
  listComparablePeriods(): Promise<string[]>;
  getComparison(params: { basePeriod: string; range: CompareRange }): Promise<ComparisonResult>;
  /** Archivo del comparativo para descarga. */
  exportComparison(params: { basePeriod: string; range: CompareRange }): Promise<Blob>;
}
