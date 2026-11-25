"use client";
import { useState } from "react";
import { AlertTriangle, BarChart3, ChevronRight, LayoutDashboard } from "lucide-react";
import { useApi } from "../../api/provider";
import { isDemo } from "../../config/env";
import { money } from "../../domain/format";
import type { DashboardSummary, PeriodStatus } from "../../domain/types";
import { pendingDependency, useResource } from "../../hooks/useResource";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { Card, Kpi, Step } from "../../components/shared/ui";
import { ComparativosTab } from "./ComparativosTab";

const STAGES = ["Carga recibida", "Entregado a Nóminas", "Validación en curso", "Layout Human", "Cierre"];
const CURRENT_STAGE: Record<PeriodStatus, number> = { captura: 0, entregado: 1, validacion: 2, cerrado: 3 };

export function InicioView() {
  const [tab, setTab] = useState<"resumen" | "comparativos">("resumen");
  return (
    <section className="screen">
      <div className="home-tabs" role="tablist">
        <button className={tab === "resumen" ? "active" : ""} onClick={() => setTab("resumen")}>
          <LayoutDashboard size={17} /> Resumen
        </button>
        <button className={tab === "comparativos" ? "active" : ""} onClick={() => setTab("comparativos")}>
          <BarChart3 size={17} /> Comparativos
        </button>
      </div>
      {tab === "resumen" ? <Resumen /> : <ComparativosTab />}
    </section>
  );
}

function Resumen() {
  const api = useApi();
  const { go, period, revision } = useWorkspace();
  const periodId = period.data?.id;
  const summary = useResource(
    () => (periodId ? api.dashboard.getSummary(periodId) : pendingDependency<DashboardSummary>()),
    `summary:${periodId ?? ""}:${revision}`,
  );
  return (
    <AsyncView resource={period} label="Cargando periodo…">
      {(p) => (
        <>
          <div className="hero">
            <div>
              <span className="eyebrow">PERIODO ACTIVO</span>
              <h2>{p.title} · Validación de bonos</h2>
              <p>
                {isDemo
                  ? "Prototipo funcional para validar el flujo antes de conectar ICON, correo, SharePoint y Human."
                  : "Valida los movimientos del periodo antes de generar el layout Human."}
              </p>
            </div>
            <button onClick={() => go("bandeja")}>
              Abrir bandeja <ChevronRight size={18} />
            </button>
          </div>
          <AsyncView resource={summary} label="Calculando indicadores…">
            {(s) => (
              <>
                <div className="kpis">
                  <Kpi label="Movimientos" value={s.totalMovements} sub="Layout semanal" />
                  <Kpi label={isDemo ? "Importe demo" : "Importe"} value={money(s.amount)} sub={isDemo ? "Muestra UX" : p.label} />
                  <Kpi label="Requieren revisión" value={s.needsReview} sub={isDemo ? "Casos demo" : "Movimientos"} />
                  <Kpi label="Con respaldo" value={`${s.withSupport}/${s.sampleSize}`} sub="Documentación" />
                </div>
                <div className="grid2">
                  <Card title="Estado del periodo">
                    <div className="steps">
                      {STAGES.map((text, i) => (
                        <Step key={text} text={text} ok={i < CURRENT_STAGE[p.status]} warn={i === CURRENT_STAGE[p.status]} />
                      ))}
                    </div>
                  </Card>
                  <Card title="Alertas operativas">
                    <AlertTriangle />
                    <p>
                      <b>{s.differences} movimientos</b> presentan diferencias entre lo solicitado y la evidencia.
                    </p>
                    <p>
                      <b>{s.missingSupport} movimiento{s.missingSupport === 1 ? "" : "s"}</b> no cuenta{s.missingSupport === 1 ? "" : "n"} con respaldo.
                    </p>
                    <button className="link" onClick={() => go("validacion")}>
                      Ir al Centro de Validación
                    </button>
                  </Card>
                </div>
              </>
            )}
          </AsyncView>
        </>
      )}
    </AsyncView>
  );
}
