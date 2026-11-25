import type { ComparisonResult } from "./types";

export const delta = (current: number, previous: number) => (previous === 0 ? 0 : ((current - previous) / previous) * 100);

export function comparisonDeltas(c: ComparisonResult) {
  return {
    amount: delta(c.amount, c.previousAmount),
    amountDiff: c.amount - c.previousAmount,
    movements: delta(c.movements, c.previousMovements),
    maxCategory: Math.max(1, ...c.categories.flatMap((item) => [item.current, item.previous])),
  };
}
