import type { BonosApi } from "../contracts";
import { ApiError } from "../errors";

/**
 * Adaptador del modo productivo mientras no existan endpoints reales.
 * Cada operación falla con `not_configured` para que la interfaz muestre un
 * estado de error explícito en lugar de datos simulados.
 */
function pending<T extends object>(module: string, methods: (keyof T & string)[]): T {
  const entries = methods.map((method) => {
    const operation = `${module}.${method}`;
    const fn = () =>
      Promise.reject(
        new ApiError("not_configured", `Integración pendiente: la operación «${operation}» del contrato propuesto aún no tiene backend productivo.`, {
          operation,
        }),
      );
    return [method, fn] as const;
  });
  return Object.fromEntries(entries) as T;
}

export function createUnconfiguredApi(): BonosApi {
  return {
    session: pending("session", ["getCurrentSession", "signOut"]),
    periods: pending("periods", ["getActivePeriod", "deliverToPayroll", "createExtension", "closeValidation", "reopen"]),
    dashboard: pending("dashboard", ["getSummary", "listComparablePeriods", "getComparison", "exportComparison"]),
    movements: pending("movements", ["list", "getEvidence", "decide", "requestSupport", "getSupportUrl"]),
    matrix: pending("matrix", ["listRules", "importMatrix"]),
    history: pending("history", ["search", "export"]),
    reconciliation: pending("reconciliation", ["getSummary"]),
    humanLayout: pending("humanLayout", ["getPreview", "generate"]),
    admin: pending("admin", ["listUsers", "addUser", "updateRole", "removeUser"]),
  };
}
