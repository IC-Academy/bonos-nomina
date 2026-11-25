import type { BonusStatus, Movement } from "./types";

/** Estados que ya no requieren acción de Nóminas. */
export const isOk = (s: BonusStatus) => s === "Cumple" || s === "Aprobado";
/** Estados con decisión tomada (incluye rechazo). */
export const isResolved = (s: BonusStatus) => isOk(s) || s === "Rechazado";

export const statusTone = (s: BonusStatus) => (isOk(s) ? "green" : s === "Revisión" ? "amber" : "red");

export function groupByBonus(items: Movement[]): Record<string, Movement[]> {
  return items.reduce<Record<string, Movement[]>>((acc, item) => {
    (acc[item.bonus] ??= []).push(item);
    return acc;
  }, {});
}

export function filterMovements(items: Movement[], query: string, status: BonusStatus | "Todos"): Movement[] {
  const term = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesText =
      !term ||
      [item.employeeName, item.employeeId, item.bonus, item.client, item.site].some((v) => v.toLowerCase().includes(term));
    return matchesText && (status === "Todos" || item.status === status);
  });
}

export const sumRequested = (items: Movement[]) => items.reduce((sum, item) => sum + item.requested, 0);

export const allResolved = (items: Movement[]) => items.every((item) => isResolved(item.status));
