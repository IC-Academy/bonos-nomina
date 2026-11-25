/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { HumanLayoutPreview } from "../../domain/types";

/**
 * El orden y formato de las columnas del TXT HUMAN lo define el generador HUMAN
 * (fuera del alcance del frontend). La interfaz sólo pide la vista previa y el
 * archivo ya generado.
 */
export interface HumanLayoutApi {
  getPreview(periodId: string): Promise<HumanLayoutPreview>;
  generate(params: { periodId: string; lotId: string }): Promise<{ fileName: string; file: Blob }>;
}
