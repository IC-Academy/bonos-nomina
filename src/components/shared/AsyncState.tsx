"use client";
import type { ReactNode } from "react";
import { AlertTriangle, PlugZap, RotateCcw } from "lucide-react";
import { userMessage, type ApiError } from "../../api/errors";
import type { Resource } from "../../hooks/useResource";

export function LoadingState({ label = "Cargando información…", attempt = 0, compact }: { label?: string; attempt?: number; compact?: boolean }) {
  return (
    <div className={"state-panel loading" + (compact ? " compact" : "")} aria-live="polite">
      <span className="state-spinner" aria-hidden />
      <b>{label}</b>
      {attempt > 0 && <small>Reintentando ({attempt})…</small>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title, compact }: { error: ApiError; onRetry?: () => void; title?: string; compact?: boolean }) {
  const pending = error.kind === "not_configured";
  return (
    <div className={"state-panel error" + (pending ? " pending" : "") + (compact ? " compact" : "")} role="alert">
      {pending ? <PlugZap /> : <AlertTriangle />}
      <b>{title ?? (pending ? "Integración pendiente" : "No se pudo cargar la información")}</b>
      <span>{userMessage(error)}</span>
      {onRetry && !pending && (
        <button className="secondary" onClick={onRetry}>
          <RotateCcw size={16} /> Reintentar
        </button>
      )}
    </div>
  );
}

/** Pinta carga / error / contenido de un recurso. Mantiene el contenido previo mientras recarga. */
export function AsyncView<T>({ resource, children, label, compact }: { resource: Resource<T>; children: (data: T) => ReactNode; label?: string; compact?: boolean }) {
  if (resource.data !== undefined && resource.status !== "error") return <>{children(resource.data)}</>;
  if (resource.status === "error" && resource.error) return <ErrorState error={resource.error} onRetry={resource.reload} compact={compact} />;
  return <LoadingState label={label} attempt={resource.attempt} compact={compact} />;
}
