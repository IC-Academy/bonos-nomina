"use client";
import { CalendarClock } from "lucide-react";
import { ROLES, type Role } from "../../domain/types";
import { useSession } from "../../session/SessionProvider";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { viewLabel } from "./navigation";

export function Topbar() {
  const { view, period } = useWorkspace();
  const { role, setDemoRole } = useSession();
  const p = period.data;
  return (
    <header className="top">
      <div>
        <small>Automatización de Bonos</small>
        <h1>{viewLabel(view)}</h1>
      </div>
      <div className="top-actions">
        {setDemoRole && (
          <label className="role-switch">
            Vista
            <select value={role} onChange={(e) => setDemoRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        )}
        <div className="period">
          <CalendarClock size={18} />
          <span>
            {p ? (
              <>
                <b>
                  {p.label} · v{p.version}.0
                </b>
                <small>{p.status === "cerrado" ? "Ciclo cerrado" : p.deadlineLabel}</small>
              </>
            ) : (
              <>
                <b>{period.status === "error" ? "Periodo no disponible" : "Cargando periodo…"}</b>
                <small>{period.status === "error" ? "Revisa la conexión" : " "}</small>
              </>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
