/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { BonusStatus, Decision, Evidence, EvidenceType, Movement } from "../../domain/types";

export interface DecideMovementInput {
  movementId: string;
  decision: Decision;
  /** Obligatoria al aprobar sin soporte o al ajustar. */
  justification?: string;
  /** Aprobación como excepción (sin soporte documental). */
  exception?: boolean;
}

export interface MovementsApi {
  /** Bandeja / Centro de validación: movimientos del periodo. */
  list(params: { periodId: string; query?: string; status?: BonusStatus }): Promise<Movement[]>;
  /** Evidencia de un movimiento: asistencia, regla de matriz o soporte documental. */
  getEvidence(movementId: string, type: EvidenceType): Promise<Evidence>;
  /** Registra la decisión. El backend debe escribir la bitácora. */
  decide(input: DecideMovementInput): Promise<Movement>;
  /** Solicita a ABM el soporte faltante. */
  requestSupport(movementId: string): Promise<void>;
  /** URL temporal de descarga/visualización de un soporte. */
  getSupportUrl(documentId: string): Promise<string>;
}
