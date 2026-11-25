/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { Period } from "../../domain/types";

export interface PeriodsApi {
  /** Periodo operativo vigente para el usuario. */
  getActivePeriod(): Promise<Period>;
  /** Marca la versión actual como entregada a Nóminas (queda congelada). */
  deliverToPayroll(periodId: string): Promise<Period>;
  /** Abre una nueva ronda/extensión para ABM sin modificar la entrega original. */
  createExtension(periodId: string): Promise<Period>;
  /** Cierra la validación; requiere que todos los movimientos tengan decisión. */
  closeValidation(periodId: string): Promise<Period>;
  /** Reapertura extraordinaria (Super Admin), con justificación obligatoria. */
  reopen(periodId: string, justification: string): Promise<Period>;
}
