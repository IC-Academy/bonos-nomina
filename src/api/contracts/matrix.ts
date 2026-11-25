/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { BonusRule } from "../../domain/types";

export interface MatrixApi {
  /** Catálogo vigente de conceptos/reglas de bono. */
  listRules(): Promise<BonusRule[]>;
  /** Carga una nueva versión de la matriz autorizada. */
  importMatrix(file: File): Promise<{ version: string }>;
}
