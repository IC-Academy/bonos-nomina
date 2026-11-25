"use client";
import { useState } from "react";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { useApi } from "../../api/provider";
import { isDemo } from "../../config/env";
import { comparisonDeltas, delta } from "../../domain/comparison";
import { money, percent } from "../../domain/format";
import { COMPARE_RANGES, type CompareRange, type ComparisonResult } from "../../domain/types";
import { useMutation } from "../../hooks/useMutation";
import { pendingDependency, useResource } from "../../hooks/useResource";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { Card, Kpi, Metric, downloadBlob } from "../../components/shared/ui";

export function ComparativosTab() {
  const api = useApi();
  const { notify, notifyError } = useWorkspace();
  const [range, setRange] = useState<CompareRange>("Mes anterior");
  const periods = useResource(() => api.dashboard.listComparablePeriods(), "comparable-periods");
  const [chosenPeriod, setBasePeriod] = useState<string | null>(null);
  const basePeriod = chosenPeriod ?? periods.data?.[0] ?? null;

  const comparison = useResource(
    () => (basePeriod ? api.dashboard.getComparison({ basePeriod, range }) : pendingDependency<ComparisonResult>()),
    `comparison:${basePeriod ?? ""}:${range}`,
  );
  const exporter = useMutation((params: { basePeriod: string; range: CompareRange }) => api.dashboard.exportComparison(params));

  return (
    <AsyncView resource={periods} label="Cargando periodos…">
      {(options) => (
        <>
          <div className="comparison-command">
            <div>
              <span className="eyebrow">ANÁLISIS DE BONOS</span>
              <h2>Comparativos por periodo</h2>
              <p>Compara importe, movimientos y resultados contra periodos anteriores.</p>
            </div>
            <label>
              Periodo base
              <select value={basePeriod ?? ""} onChange={(e) => setBasePeriod(e.target.value)}>
                {options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="range-tabs">
            {COMPARE_RANGES.map((r) => (
              <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
          <AsyncView resource={comparison} label="Calculando comparativo…">
            {(c) => {
              const d = comparisonDeltas(c);
              return (
                <>
                  <div className="comparison-context">
                    <span>
                      <b>{basePeriod}</b> contra <b>{c.reference}</b>
                    </span>
                    {isDemo && <em>DATOS DEMO</em>}
                  </div>
                  <div className="kpis comparison-kpis">
                    <Kpi label="Importe periodo base" value={money(c.amount)} sub={basePeriod ?? ""} />
                    <Kpi label="Importe comparado" value={money(c.previousAmount)} sub={c.reference} />
                    <Kpi label="Variación de importe" value={percent(d.amount)} sub={money(d.amountDiff)} />
                    <Kpi label="Movimientos" value={c.movements} sub={`${percent(d.movements)} vs. comparado`} />
                  </div>
                  <div className="comparison-grid">
                    <Card title="Importe por tipo de bono">
                      <div className="chart-legend">
                        <span>
                          <i className="current-dot" /> {basePeriod}
                        </span>
                        <span>
                          <i className="previous-dot" /> {c.reference}
                        </span>
                      </div>
                      <div className="category-comparison">
                        {c.categories.map((cat) => {
                          const change = delta(cat.current, cat.previous);
                          return (
                            <div className="category-row" key={cat.name}>
                              <div className="category-label">
                                <b>{cat.name}</b>
                                <span className={change >= 0 ? "positive" : "negative"}>
                                  {change >= 0 ? <TrendingUp /> : <TrendingDown />}
                                  {percent(change)}
                                </span>
                              </div>
                              <div className="bar-line">
                                <div className="bar current" style={{ width: `${(cat.current / d.maxCategory) * 100}%` }}>
                                  <span>{money(cat.current)}</span>
                                </div>
                              </div>
                              <div className="bar-line">
                                <div className="bar previous" style={{ width: `${(cat.previous / d.maxCategory) * 100}%` }}>
                                  <span>{money(cat.previous)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                    <Card title="Indicadores del comparativo">
                      <div className="comparison-metrics">
                        <Metric label="Movimientos actuales" value={String(c.movements)} />
                        <Metric label="Movimientos comparados" value={String(c.previousMovements)} />
                        <Metric label="Aceptados actuales" value={String(c.approved)} />
                        <Metric label="Aceptados comparados" value={String(c.previousApproved)} />
                      </div>
                      <div className="variance-callout">
                        {d.amount >= 0 ? <TrendingUp /> : <TrendingDown />}
                        <div>
                          <b>
                            {d.amount.toFixed(1)}% de {d.amount >= 0 ? "crecimiento" : "variación"}
                          </b>
                          <p>
                            El importe {d.amount >= 0 ? "aumentó" : "disminuyó"} {money(Math.abs(d.amountDiff))} en el corte seleccionado.
                          </p>
                        </div>
                      </div>
                      <button
                        className="secondary comparison-export"
                        disabled={exporter.pending || !basePeriod}
                        onClick={async () => {
                          if (!basePeriod) return;
                          const result = await exporter.run({ basePeriod, range });
                          if (!result.ok) return notifyError(result.error);
                          downloadBlob(result.data, `comparativo_${basePeriod}_${range}.csv`.replace(/\s+/g, "_"));
                          notify(`Comparativo ${basePeriod} vs. ${c.reference} exportado.`);
                        }}
                      >
                        <Download /> {exporter.pending ? "Exportando…" : "Exportar comparativo"}
                      </button>
                    </Card>
                  </div>
                </>
              );
            }}
          </AsyncView>
        </>
      )}
    </AsyncView>
  );
}
