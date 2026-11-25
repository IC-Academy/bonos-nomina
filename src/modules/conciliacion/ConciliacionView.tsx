"use client";
import { useApi } from "../../api/provider";
import { pendingDependency, useResource } from "../../hooks/useResource";
import type { ReconciliationSummary } from "../../domain/types";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { Card, Head, Kpi } from "../../components/shared/ui";

export function ConciliacionView() {
  const api = useApi();
  const { period } = useWorkspace();
  const periodId = period.data?.id;
  const summary = useResource(
    () => (periodId ? api.reconciliation.getSummary(periodId) : pendingDependency<ReconciliationSummary>()),
    `reconciliation:${periodId ?? ""}`,
  );
  return (
    <section className="screen">
      <Head title="Conciliación" text="Correo recibido vs. solicitud registrada vs. entrega a Nóminas vs. soporte." />
      <AsyncView resource={period.status === "error" ? { ...summary, status: "error", error: period.error, reload: period.reload } : summary} label="Conciliando…">
        {(s) => (
          <>
            <div className="kpis">
              <Kpi label="Detectadas" value={s.detected} sub="Correo" />
              <Kpi label="Registradas" value={s.registered} sub="Plataforma" />
              <Kpi label="Entregadas" value={s.delivered} sub="Nóminas" />
              <Kpi label="Con respaldo" value={`${s.withSupport}/${s.supportBase}`} sub="Documentos" />
            </div>
            <Card title="Pendientes por conciliar">
              {s.pending.length ? (
                s.pending.map((item) => (
                  <p key={item.description}>
                    <b>
                      {item.count} solicitud{item.count === 1 ? "" : "es"}
                    </b>{" "}
                    {item.description}
                  </p>
                ))
              ) : (
                <p>Sin pendientes por conciliar.</p>
              )}
            </Card>
          </>
        )}
      </AsyncView>
    </section>
  );
}
