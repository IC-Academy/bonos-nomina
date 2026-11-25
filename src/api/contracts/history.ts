/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { Movement } from "../../domain/types";

export interface HistorySearch {
  query?: string;
  periodId?: string;
  client?: string;
  site?: string;
  bonus?: string;
}

export interface HistoryApi {
  search(params: HistorySearch): Promise<Movement[]>;
  export(params: HistorySearch): Promise<Blob>;
}
