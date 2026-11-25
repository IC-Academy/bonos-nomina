"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useApi } from "../api/provider";
import { userMessage } from "../api/errors";
import type { Movement, Period, View } from "../domain/types";
import { pendingDependency, useResource, type Resource } from "../hooks/useResource";

export interface Notice {
  text: string;
  tone: "info" | "error";
}

interface WorkspaceValue {
  view: View;
  go: (view: View) => void;
  notice: Notice | null;
  notify: (text: string) => void;
  notifyError: (error: unknown) => void;
  period: Resource<Period>;
  /** Movimientos del periodo activo, compartidos por Bandeja, Validación y Layout. */
  movements: Resource<Movement[]>;
  replaceMovement: (movement: Movement) => void;
  selectedId: string | null;
  openMovement: (id: string) => void;
  selectMovement: (id: string) => void;
  /** Cambia cuando hay escrituras, para que los módulos derivados recarguen. */
  revision: number;
  bumpRevision: () => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [view, setView] = useState<View>("inicio");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const period = useResource(() => api.periods.getActivePeriod(), "period");
  const periodId = period.data?.id;
  const movementsRaw = useResource<Movement[]>(
    () => (periodId ? api.movements.list({ periodId }) : pendingDependency<Movement[]>()),
    `movements:${periodId ?? ""}`,
  );
  // Si el periodo no carga, los movimientos heredan su error (y su reintento).
  const movements = useMemo<Resource<Movement[]>>(
    () =>
      !periodId && period.status === "error"
        ? { ...movementsRaw, status: "error", error: period.error, reload: period.reload }
        : movementsRaw,
    [periodId, period.status, period.error, period.reload, movementsRaw],
  );

  const notify = useCallback((text: string) => setNotice({ text, tone: "info" }), []);
  const notifyError = useCallback((error: unknown) => setNotice({ text: userMessage(error), tone: "error" }), []);
  const go = useCallback((next: View) => {
    setView(next);
    setNotice(null);
  }, []);
  const { setData: setMovements } = movements;
  const replaceMovement = useCallback(
    (m: Movement) => {
      setMovements((current) => current?.map((item) => (item.id === m.id ? m : item)));
      setRevision((r) => r + 1);
    },
    [setMovements],
  );
  const openMovement = useCallback(
    (id: string) => {
      setSelectedId(id);
      go("validacion");
    },
    [go],
  );
  const bumpRevision = useCallback(() => setRevision((r) => r + 1), []);

  const value = useMemo<WorkspaceValue>(
    () => ({ view, go, notice, notify, notifyError, period, movements, replaceMovement, selectedId, openMovement, selectMovement: setSelectedId, revision, bumpRevision }),
    [view, go, notice, notify, notifyError, period, movements, replaceMovement, selectedId, openMovement, revision, bumpRevision],
  );
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace debe usarse dentro de <WorkspaceProvider>.");
  return ctx;
}
