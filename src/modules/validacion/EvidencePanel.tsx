"use client";
import { AlertTriangle, Eye, FileText } from "lucide-react";
import { useApi } from "../../api/provider";
import { money } from "../../domain/format";
import type { Evidence, EvidenceType, Movement } from "../../domain/types";
import { useMutation } from "../../hooks/useMutation";
import { useResource } from "../../hooks/useResource";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { isDemo } from "../../config/env";
import { AsyncView } from "../../components/shared/AsyncState";
import { Metric, Status } from "../../components/shared/ui";

const TITLES: Record<EvidenceType, string> = {
  asistencia: "Asistencia e instalación",
  matriz: "Regla de Matriz de Bonos",
  soporte: "Soporte documental",
};

export function EvidencePanel({ type, movement, close }: { type: EvidenceType; movement: Movement; close: () => void }) {
  const api = useApi();
  const evidence = useResource(() => api.movements.getEvidence(movement.id, type), `evidence:${movement.id}:${type}`);
  return (
    <div className="modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && close()} onKeyDown={(e) => e.key === "Escape" && close()}>
      <section className="modal" aria-label={TITLES[type]}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">EVIDENCIA · {movement.id}</span>
            <h3>{TITLES[type]}</h3>
          </div>
          <button className="close" onClick={close} aria-label="Cerrar">
            ×
          </button>
        </div>
        <AsyncView resource={evidence} label="Consultando evidencia…" compact>
          {(e) => <EvidenceBody evidence={e} movement={movement} close={close} />}
        </AsyncView>
        <div className="modal-actions">
          <button className="secondary" onClick={close}>
            Cerrar
          </button>
        </div>
      </section>
    </div>
  );
}

function EvidenceBody({ evidence, movement, close }: { evidence: Evidence; movement: Movement; close: () => void }) {
  const api = useApi();
  const { notify, notifyError } = useWorkspace();
  const openDoc = useMutation((id: string) => api.movements.getSupportUrl(id));
  const requestSupport = useMutation((id: string) => api.movements.requestSupport(id));

  if (evidence.type === "asistencia") {
    return (
      <>
        <div className="evidence-summary">
          <Metric label="Empleado" value={evidence.employeeId} />
          <Metric label="Coincidencias" value={evidence.requiredDays ? `${evidence.matchedDays} / ${evidence.requiredDays}` : "N/A"} />
          <Metric label="Instalación" value={evidence.site} />
        </div>
        <table>
          <thead>
            <tr>
              <th>Día</th>
              <th>Instalación observada</th>
              <th>Incidencia</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {evidence.days.map((d) => (
              <tr key={d.day}>
                <td>{d.day}</td>
                <td>{d.observedSite ?? "Instalación distinta / sin registro"}</td>
                <td>{d.incident}</td>
                <td>
                  <Status s={d.matches ? "Cumple" : "Revisión"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isDemo && (
          <p className="source-note">Vista demo de la evidencia que ABM consultará en ICON. Para esta validación UX se simula con la estructura real de asistencia.</p>
        )}
      </>
    );
  }
  if (evidence.type === "matriz") {
    return (
      <>
        <div className="rule-card">
          <span>BONO</span>
          <b>{evidence.bonus}</b>
          <span>CLIENTE / INSTALACIÓN</span>
          <b>{evidence.scope}</b>
          <span>TIPO DE IMPORTE</span>
          <b>{evidence.amountType}</b>
          <span>REGLA DE VALIDACIÓN</span>
          <b>{evidence.validationRule}</b>
          <span>IMPORTE CALCULADO</span>
          <b>{money(evidence.calculated)}</b>
          {evidence.matrixVersion && (
            <>
              <span>VERSIÓN DE MATRIZ</span>
              <b>{evidence.matrixVersion}</b>
            </>
          )}
        </div>
        {isDemo && <p className="source-note">Vista demo de la regla vigente. En la fase de integración se mostrará la versión exacta de la Matriz de Bonos utilizada.</p>}
      </>
    );
  }
  if (evidence.documents.length) {
    return (
      <>
        {evidence.documents.map((doc) => (
          <div className="document-preview" key={doc.id}>
            <FileText size={42} />
            <div>
              <b>{doc.fileName}</b>
              <p>{doc.description}</p>
            </div>
            <button
              disabled={openDoc.pending}
              onClick={async () => {
                const r = await openDoc.run(doc.id);
                if (!r.ok) return r.error.kind === "not_configured" ? notify(r.error.message) : notifyError(r.error);
                window.open(r.data, "_blank", "noopener");
              }}
            >
              <Eye /> {openDoc.pending ? "Abriendo…" : "Vista previa"}
            </button>
          </div>
        ))}
      </>
    );
  }
  return (
    <div className="missing-support">
      <AlertTriangle size={36} />
      <h4>No se encontró respaldo documental</h4>
      <p>Este movimiento debe solicitar evidencia antes de aprobarse.</p>
      <button
        disabled={requestSupport.pending}
        onClick={async () => {
          const r = await requestSupport.run(movement.id);
          if (!r.ok) return notifyError(r.error);
          notify(`Solicitud de soporte registrada para ${movement.employeeName}.`);
          close();
        }}
      >
        {requestSupport.pending ? "Enviando…" : "Solicitar soporte"}
      </button>
    </div>
  );
}
