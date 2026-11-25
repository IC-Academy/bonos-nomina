/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { ReconciliationSummary } from "../../domain/types";

export interface ReconciliationApi {
  /** Correo recibido vs. solicitud registrada vs. entrega a Nóminas vs. soporte. */
  getSummary(periodId: string): Promise<ReconciliationSummary>;
}
