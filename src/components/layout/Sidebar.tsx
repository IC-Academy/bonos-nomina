"use client";
import { isDemo } from "../../config/env";
import { initials } from "../../domain/format";
import { useSession } from "../../session/SessionProvider";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { NAV } from "./navigation";

export function Sidebar() {
  const { view, go } = useWorkspace();
  const { session, role } = useSession();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">IC</div>
        <div>
          <strong>Bonos Nómina</strong>
          <small>INTER-CON · México</small>
        </div>
      </div>
      <nav>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => go(id)}>
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="user">
        <div className="avatar">{initials(session.user.displayName)}</div>
        <div>
          <strong>{session.user.displayName}</strong>
          <small>
            {role}
            {isDemo ? " · Demo UX" : ""}
          </small>
        </div>
      </div>
    </aside>
  );
}
