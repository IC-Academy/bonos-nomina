/**
 * Contrato completo que consume la interfaz (PROPUESTA).
 * Implementaciones: `adapters/demo` (datos ficticios) y `adapters/unconfigured`
 * (modo productivo mientras no exista backend).
 */
import type { AdminApi } from "./admin";
import type { DashboardApi } from "./dashboard";
import type { HistoryApi } from "./history";
import type { HumanLayoutApi } from "./humanLayout";
import type { MatrixApi } from "./matrix";
import type { MovementsApi } from "./movements";
import type { PeriodsApi } from "./periods";
import type { ReconciliationApi } from "./reconciliation";
import type { SessionApi } from "./session";

export interface BonosApi {
  session: SessionApi;
  periods: PeriodsApi;
  dashboard: DashboardApi;
  movements: MovementsApi;
  matrix: MatrixApi;
  history: HistoryApi;
  reconciliation: ReconciliationApi;
  humanLayout: HumanLayoutApi;
  admin: AdminApi;
}

export type { AdminApi, DashboardApi, HistoryApi, HumanLayoutApi, MatrixApi, MovementsApi, PeriodsApi, ReconciliationApi, SessionApi };
export type { Session } from "./session";
export type { DecideMovementInput } from "./movements";
export type { HistorySearch } from "./history";
