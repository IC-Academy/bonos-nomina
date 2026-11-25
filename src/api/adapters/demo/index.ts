import type { BonosApi } from "../../contracts";
import { ApiError } from "../../errors";
import { isOk } from "../../../domain/movements";
import type { Evidence, Movement, Period } from "../../../domain/types";
import { demoComparablePeriods, demoComparisons, demoMovements, demoPeriod, demoRules, demoTotalMovements, demoUsers } from "./data";

/**
 * Adaptador en memoria con datos ficticios. Simula latencia para que los
 * estados de carga sean visibles. El estado se reinicia al recargar la página.
 */
const LATENCY_MS = 250;
const delay = <T>(value: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));
const demoOnly = (operation: string, message: string) => Promise.reject(new ApiError("not_configured", message, { operation }));

const csv = (rows: (string | number)[][]) =>
  new Blob(["﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });

export function createDemoApi(): BonosApi {
  let period: Period = { ...demoPeriod };
  let movements: Movement[] = demoMovements.map((m) => ({ ...m }));
  let users = demoUsers.map((u) => ({ ...u }));

  const findMovement = (id: string) => {
    const movement = movements.find((m) => m.id === id);
    if (!movement) throw new ApiError("not_found", "Movimiento no encontrado.", { operation: "movements" });
    return movement;
  };
  const updatePeriod = (patch: Partial<Period>) => {
    period = { ...period, ...patch };
    return delay(period);
  };

  return {
    session: {
      getCurrentSession: () => delay({ user: demoUsers[0], role: demoUsers[0].role }),
      signOut: () => delay(undefined),
    },
    periods: {
      getActivePeriod: () => delay(period),
      deliverToPayroll: () => updatePeriod({ status: period.status === "captura" ? "validacion" : period.status }),
      createExtension: () => updatePeriod({ version: period.version + 1 }),
      closeValidation: () => {
        if (!movements.every((m) => isOk(m.status) || m.status === "Rechazado")) {
          return Promise.reject(new ApiError("conflict", "Aún existen movimientos sin decisión.", { operation: "periods.closeValidation" }));
        }
        return updatePeriod({ status: "cerrado" });
      },
      reopen: () => updatePeriod({ status: "validacion", version: period.version + 1 }),
    },
    dashboard: {
      getSummary: () =>
        delay({
          totalMovements: demoTotalMovements,
          amount: movements.reduce((sum, m) => sum + m.requested, 0),
          needsReview: movements.filter((m) => !isOk(m.status)).length,
          withSupport: movements.filter((m) => m.hasSupport || m.exception).length,
          sampleSize: movements.length,
          differences: movements.filter((m) => m.requested !== m.calculated && !isOk(m.status) && m.status !== "Rechazado").length,
          missingSupport: movements.filter((m) => !m.hasSupport && !m.exception).length,
        }),
      listComparablePeriods: () => delay(demoComparablePeriods),
      getComparison: ({ range }) => delay(demoComparisons[range]),
      exportComparison: ({ basePeriod, range }) => {
        const c = demoComparisons[range];
        return delay(
          csv([
            ["Concepto", basePeriod, c.reference],
            ...c.categories.map((cat) => [cat.name, cat.current, cat.previous]),
            ["Total", c.amount, c.previousAmount],
            ["DATOS DEMO", "", ""],
          ]),
        );
      },
    },
    movements: {
      list: () => delay(movements),
      getEvidence: (movementId, type) => {
        const m = findMovement(movementId);
        const transport = m.bonus.toLowerCase().includes("transporte");
        const evidence: Evidence =
          type === "asistencia"
            ? {
                type,
                employeeId: m.employeeId,
                site: m.site,
                requiredDays: m.attendanceDays,
                matchedDays: m.attendanceMatched,
                days: ["Lun", "Mar", "Mié", "Jue", "Vie"].slice(0, m.attendanceDays || 5).map((day, i) => ({
                  day,
                  observedSite: i < m.attendanceMatched ? m.site : null,
                  incident: i < m.attendanceMatched ? "ASISTENCIA" : "REVISAR",
                  matches: i < m.attendanceMatched,
                })),
              }
            : type === "matriz"
              ? {
                  type,
                  bonus: m.bonus,
                  scope: `${m.client} · ${m.site}`,
                  amountType: transport ? "NETO" : "BRUTO",
                  validationRule: transport ? "Asistencia + instalación + días trabajados" : "Soporte + autorización + vigencia",
                  calculated: m.calculated,
                }
              : {
                  type,
                  documents: m.hasSupport
                    ? [{ id: `DOC-${m.id}`, fileName: `Soporte_${m.employeeId}_${m.id}.pdf`, description: "Documento asociado a la solicitud · Demo UX" }]
                    : [],
                };
        return delay(evidence);
      },
      decide: ({ movementId, decision, exception }) => {
        const next = { ...findMovement(movementId), status: decision, exception: exception ?? false };
        movements = movements.map((m) => (m.id === movementId ? next : m));
        return delay(next);
      },
      requestSupport: () => delay(undefined),
      getSupportUrl: () => demoOnly("movements.getSupportUrl", "Demo: la apertura del PDF se conectará al archivo real en SharePoint."),
    },
    matrix: {
      listRules: () => delay(demoRules),
      importMatrix: () => demoOnly("matrix.importMatrix", "Demo: la carga de la matriz autorizada se habilitará al conectar el backend."),
    },
    history: {
      search: ({ query }) => {
        const term = query?.trim().toLowerCase() ?? "";
        return delay(
          term
            ? movements.filter((m) => [m.employeeName, m.employeeId, m.bonus, m.client, m.site].some((v) => v.toLowerCase().includes(term)))
            : movements,
        );
      },
      export: () =>
        delay(
          csv([
            ["Movimiento", "Empleado", "Nombre", "Bono", "Cliente", "Instalación", "Solicitado", "Resultado"],
            ...movements.map((m) => [m.id, m.employeeId, m.employeeName, m.bonus, m.client, m.site, m.requested, m.status]),
          ]),
        ),
    },
    reconciliation: {
      getSummary: () =>
        delay({
          detected: 12,
          registered: 12,
          delivered: 10,
          withSupport: 9,
          supportBase: 10,
          pending: [
            { count: 2, description: "detectadas todavía no han sido entregadas a Nóminas." },
            { count: 1, description: "entregada no tiene respaldo asociado." },
          ],
        }),
    },
    humanLayout: {
      getPreview: () =>
        delay({
          approved: movements.filter((m) => isOk(m.status)).length,
          excluded: movements.filter((m) => !isOk(m.status)).length,
          suggestedLot: "SEM38-01",
          structureLabel: "20 cols.",
          encodingLabel: "TXT · ISO-8859-1",
          previewLines: [
            "5280 ⇥ E-10002 ⇥ ∅ ⇥ BONO ASISTENCIA ⇥ E-10002 ⇥ ∅ ⇥ ... ⇥ 900.00 ⇥ ... ⇥ SEM38-01",
            "5170 ⇥ E-10001 ⇥ ∅ ⇥ AYUDA TRANSPORTE ⇥ E-10001 ⇥ ∅ ⇥ ... ⇥ 500.00 ⇥ ... ⇥ ∅",
          ],
        }),
      generate: () =>
        demoOnly("humanLayout.generate", "Demo: el TXT HUMAN lo producirá el generador HUMAN cuando esté integrado. No se generó ningún archivo."),
    },
    admin: {
      listUsers: () => delay(users),
      addUser: ({ displayName, role }) => {
        const user = { id: `u-${Date.now()}`, displayName, role };
        users = [...users, user];
        return delay(user);
      },
      updateRole: (userId, role) => {
        users = users.map((u) => (u.id === userId ? { ...u, role } : u));
        const user = users.find((u) => u.id === userId);
        return user ? delay(user) : Promise.reject(new ApiError("not_found", "Usuario no encontrado.", { operation: "admin.updateRole" }));
      },
      removeUser: (userId) => {
        users = users.filter((u) => u.id !== userId);
        return delay(undefined);
      },
    },
  };
}
