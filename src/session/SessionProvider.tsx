"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useApi } from "../api/provider";
import type { Session } from "../api/contracts";
import { isDemo } from "../config/env";
import { permissionsFor, type Permission } from "../domain/permissions";
import type { Role } from "../domain/types";
import { useResource } from "../hooks/useResource";
import { ErrorState, LoadingState } from "../components/shared/AsyncState";

interface SessionContextValue {
  session: Session;
  /** Rol efectivo (en demo puede sobrescribirse con el selector "Vista"). */
  role: Role;
  can: (permission: Permission) => boolean;
  /** Sólo existe en modo demo: simula otro rol sin backend. */
  setDemoRole: ((role: Role) => void) | null;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const resource = useResource(() => api.session.getCurrentSession(), "session");
  const [demoRole, setDemoRoleState] = useState<Role | null>(null);
  const setDemoRole = useCallback((role: Role) => setDemoRoleState(role), []);
  const signOut = useCallback(async () => {
    await api.session.signOut();
    resource.reload();
  }, [api, resource]);

  const value = useMemo<SessionContextValue | null>(() => {
    if (!resource.data) return null;
    const role = (isDemo && demoRole) || resource.data.role;
    const permissions = permissionsFor(role);
    return {
      session: resource.data,
      role,
      can: (permission) => permissions.includes(permission),
      setDemoRole: isDemo ? setDemoRole : null,
      signOut,
    };
  }, [resource.data, demoRole, setDemoRole, signOut]);

  if (!value) {
    if (resource.status === "error" && resource.error) {
      const unauthorized = resource.error.kind === "unauthorized";
      return (
        <div className="state-page">
          <ErrorState
            title={unauthorized ? "Inicia sesión para continuar" : "No fue posible validar tu sesión"}
            error={resource.error}
            onRetry={resource.reload}
          />
        </div>
      );
    }
    return (
      <div className="state-page">
        <LoadingState label="Validando sesión…" attempt={resource.attempt} />
      </div>
    );
  }
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>.");
  return ctx;
}
