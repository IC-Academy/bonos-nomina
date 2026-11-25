"use client";
import { useSession } from "../../session/SessionProvider";
import { useState } from "react";
import { useApi } from "../../api/provider";
import { isDemo } from "../../config/env";
import type { HumanLayoutPreview } from "../../domain/types";
import { useMutation } from "../../hooks/useMutation";
import { pendingDependency, useResource } from "../../hooks/useResource";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { Card, Head, Kpi, downloadBlob } from "../../components/shared/ui";

/**
 * Sólo muestra la vista previa y solicita el archivo. El contenido del TXT
 * (columnas, orden, codificación) es responsabilidad del generador HUMAN.
 */
export function LayoutHumanView() {
  const api = useApi();
  const { can } = useSession();
  const { period, revision, notify, notifyError } = useWorkspace();
  const periodId = period.data?.id;
  const preview = useResource(
    () => (periodId ? api.humanLayout.getPreview(periodId) : pendingDependency<HumanLayoutPreview>()),
    `human-preview:${periodId ?? ""}:${revision}`,
  );
  const [lot, setLot] = useState<string | null>(null);
  const generate = useMutation((id: string, lotId: string) => api.humanLayout.generate({ periodId: id, lotId }));
  const closed = period.data?.status === "cerrado";

  return (
    <section className="screen">
      <Head
        title="Layout Human"
        text={`Sólo movimientos aprobados; ${isDemo ? "Nóminas asigna" : "se asigna"} manualmente el lote del proceso de nómina.`}
      />
      <AsyncView resource={period.status === "error" ? { ...preview, status: "error", error: period.error, reload: period.reload } : preview} label="Preparando vista previa…">
        {(pv) => {
          const lotId = lot ?? pv.suggestedLot;
          return (
            <>
              <div className="kpis">
                <Kpi label="Aprobados" value={pv.approved} sub="Listos" />
                <Kpi label="Excluidos" value={pv.excluded} sub="Con observaciones" />
                <Kpi label="Lote" value={lotId || "–"} sub="Asignación manual" />
                <Kpi label="Estructura" value={pv.structureLabel} sub={pv.encodingLabel} />
              </div>
              <Card title="Vista previa">
                <label className="lot-field">
                  Identificador de lote Human
                  <input value={lotId} onChange={(e) => setLot(e.target.value)} />
                </label>
                <pre className="preview">{pv.previewLines.join("\n")}</pre>
                <button
                  disabled={!can("human.generar") || !closed || !periodId || !lotId.trim() || generate.pending}
                  onClick={async () => {
                    if (!periodId || !can("human.generar") || !closed) return;
                    const r = await generate.run(periodId, lotId.trim());
                    if (!r.ok) return r.error.kind === "not_configured" ? notify(r.error.message) : notifyError(r.error);
                    downloadBlob(r.data.file, r.data.fileName);
                    notify(`TXT Human generado: ${r.data.fileName}.`);
                  }}
                >
                  {generate.pending ? "Generando…" : `Generar TXT ${closed ? "" : "· cierre pendiente"}`}
                </button>
              </Card>
            </>
          );
        }}
      </AsyncView>
    </section>
  );
}
