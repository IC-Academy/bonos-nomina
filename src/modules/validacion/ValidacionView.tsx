"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Database, Eye, FileText, LockKeyhole, RotateCcw, XCircle } from "lucide-react";
import { useApi } from "../../api/provider";
import type { DecideMovementInput } from "../../api/contracts";
import { money } from "../../domain/format";
import { allResolved, groupByBonus, isResolved } from "../../domain/movements";
import type { Decision, EvidenceType, Movement } from "../../domain/types";
import { useMutation } from "../../hooks/useMutation";
import { useSession } from "../../session/SessionProvider";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { Check, Head, Metric, Status } from "../../components/shared/ui";
import { EvidencePanel } from "./EvidencePanel";

const DECISION_NOTICE: Record<Decision, string> = {
  Aprobado: "Movimiento aprobado y registrado en la bitácora.",
  Rechazado: "Movimiento devuelto a ABM; el original permanece protegido.",
  Revisión: "Ajuste guardado para revisión.",
};

export function ValidacionView() {
  const { movements } = useWorkspace();
  return (
    <section className="screen">
      <Head title="Centro de Validación" text="Solicitud, matriz, asignación, asistencia y respaldo en una sola decisión." />
      <AsyncView resource={movements} label="Cargando movimientos…">
        {(items) =>
          items.length ? (
            <Validation items={items} />
          ) : (
            <div className="empty-filter">
              <b>Sin movimientos</b>
              <span>El periodo activo no tiene movimientos por validar.</span>
            </div>
          )
        }
      </AsyncView>
    </section>
  );
}

function Validation({ items }: { items: Movement[] }) {
  const api = useApi();
  const { session, role, can } = useSession();
  const { period, selectedId, selectMovement, replaceMovement, notify, notifyError } = useWorkspace();
  const [expanded, setExpanded] = useState<string[]>(["Ayuda de transporte"]);
  const [evidence, setEvidence] = useState<EvidenceType | null>(null);
  const [justification, setJustification] = useState("");
  const decide = useMutation((input: DecideMovementInput) => api.movements.decide(input));
  const closeValidation = useMutation((id: string) => api.periods.closeValidation(id));
  const reopen = useMutation((id: string, text: string) => api.periods.reopen(id, text));

  const groups = useMemo(() => groupByBonus(items), [items]);
  const selected = items.find((m) => m.id === selectedId) ?? items[0];
  const p = period.data;
  const closed = p?.status === "cerrado";
  const resolved = allResolved(items);
  const busy = decide.pending || closeValidation.pending || reopen.pending;

  const submit = async (decision: Decision, exception = false) => {
    if (closed || !can("validacion.decidir")) return notify("Operación no permitida.");
    if (exception && !can("validacion.excepcion")) return notify("La excepción requiere autorización de Super Admin.");
    if (decision === "Aprobado" && selected.requested !== selected.calculated && !justification.trim()) return notify("Justifica la diferencia de importe.");
    const r = await decide.run({ movementId: selected.id, decision, exception, justification: justification.trim() || undefined });
    if (!r.ok) return notifyError(r.error);
    replaceMovement(r.data);
    notify(DECISION_NOTICE[decision]);
  };

  return (
    <div className="validation">
      <div className="case-list grouped">
        {Object.entries(groups).map(([name, group]) => (
          <section className="case-group" key={name}>
            <button className="group-title" onClick={() => setExpanded((c) => (c.includes(name) ? c.filter((i) => i !== name) : [...c, name]))}>
              <span>
                <b>{name}</b>
                <small>
                  {group.length} movimientos · {group.filter((i) => !isResolved(i.status)).length} por revisar
                </small>
              </span>
              {expanded.includes(name) ? <ChevronUp /> : <ChevronDown />}
            </button>
            {expanded.includes(name) &&
              group.map((m) => (
                <button className={selected.id === m.id ? "case active" : "case"} onClick={() => selectMovement(m.id)} key={m.id}>
                  <span>
                    <b>{m.employeeName}</b>
                    <small>
                      {m.employeeId} · {m.source}
                    </small>
                  </span>
                  <Status s={m.status} />
                </button>
              ))}
          </section>
        ))}
      </div>
      <div className="case-detail">
        <div className="case-head">
          <div>
            <span className="eyebrow">{selected.id}</span>
            <h2>{selected.employeeName}</h2>
            <p>
              {selected.client} · {selected.site}
            </p>
          </div>
          <Status s={selected.status} />
        </div>
        <div className="money-row">
          <Metric label="Solicitado" value={money(selected.requested)} />
          <Metric label="Cálculo ABM" value={money(selected.calculated)} />
          <Metric label="Diferencia" value={money(Math.abs(selected.requested - selected.calculated))} />
        </div>
        <div className="checks">
          <Check ok text="Empleado localizado" />
          <Check ok text="Regla vigente encontrada en matriz" />
          <Check ok text="Asignación localizada" />
          <Check
            ok={selected.attendanceMatched === selected.attendanceDays}
            warn={selected.attendanceMatched !== selected.attendanceDays}
            text={selected.attendanceDays ? `${selected.attendanceMatched} de ${selected.attendanceDays} asistencias coinciden` : "Asistencia no requerida"}
          />
          <Check ok={selected.hasSupport} warn={!selected.hasSupport} text={selected.hasSupport ? "Respaldo encontrado" : "Falta respaldo documental"} />
        </div>
        <div className="evidence">
          <button onClick={() => setEvidence("asistencia")}>
            <Eye /> Ver asistencia
          </button>
          <button onClick={() => setEvidence("matriz")}>
            <Database /> Ver matriz
          </button>
          <button onClick={() => setEvidence("soporte")}>
            <FileText /> Ver soporte
          </button>
        </div>
        {evidence && <EvidencePanel type={evidence} movement={selected} close={() => setEvidence(null)} />}
        <label className="comment">
          Justificación / comentario
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Obligatorio cuando el monto autorizado difiere del solicitado o se acepta sin soporte."
          />
        </label>
        {!closed && can("validacion.decidir") && (
          <div className="decision">
            <button
              disabled={busy || (!selected.hasSupport && !can("validacion.excepcion"))}
              onClick={() =>
                selected.hasSupport || justification.trim()
                  ? submit("Aprobado", !selected.hasSupport)
                  : notify("Captura una justificación para aceptar el bono sin soporte.")
              }
            >
              <CheckCircle2 /> Aprobar {money(selected.calculated)}
            </button>
            <button className="secondary" disabled={busy} onClick={() => submit("Revisión")}>
              <AlertTriangle /> Ajustar
            </button>
            <button className="danger" disabled={busy} onClick={() => submit("Rechazado")}>
              <XCircle /> Rechazar y devolver a ABM
            </button>
          </div>
        )}
        <div className="close-validation">
          <span>
            <b>{resolved ? "Todos los movimientos tienen decisión" : "Aún existen excepciones pendientes"}</b>
            <small>{resolved ? "El periodo puede pasar a la generación del layout." : "Resuelve cada excepción o autorízala con justificación."}</small>
          </span>
          {!closed ? (
            <button
              disabled={!p || !resolved || !can("validacion.cerrar") || busy}
              onClick={async () => {
                if (!p) return;
                const r = await closeValidation.run(p.id);
                if (!r.ok) return notifyError(r.error);
                period.setData(() => r.data);
                notify("Validación cerrada. Periodo disponible para Layout Human.");
              }}
            >
              <LockKeyhole /> {closeValidation.pending ? "Cerrando…" : "Cerrar validación"}
            </button>
          ) : (
            can("periodo.reabrir") && (
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  if (!p) return;
                  if (!justification.trim()) return notify("Captura una justificación para reabrir el ciclo.");
                  const r = await reopen.run(p.id, justification.trim());
                  if (!r.ok) return notifyError(r.error);
                  period.setData(() => r.data);
                  notify(`Ciclo reabierto por ${session.user.displayName} (${role}) como versión extraordinaria.`);
                }}
              >
                <RotateCcw /> {reopen.pending ? "Reabriendo…" : "Reabrir ciclo"}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
