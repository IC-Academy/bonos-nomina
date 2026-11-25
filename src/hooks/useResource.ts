"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ApiError, toApiError } from "../api/errors";
import { withRetry } from "../api/retry";

export type ResourceStatus = "loading" | "success" | "error";

export interface Resource<T> {
  status: ResourceStatus;
  data: T | undefined;
  error: ApiError | undefined;
  /** Número de reintento automático en curso (0 = primer intento). */
  attempt: number;
  reload: () => void;
  /** Actualización local tras una mutación exitosa. */
  setData: (updater: (current: T | undefined) => T | undefined) => void;
}

interface State<T> {
  /** Clave de la última solicitud terminada. */
  settledKey: string | null;
  data?: T;
  error?: ApiError;
  attempt: number;
}

/**
 * Carga datos de la capa de servicios con reintentos automáticos para fallos
 * transitorios y `reload()` manual. Conserva los datos previos mientras recarga.
 * `key` identifica la consulta: al cambiar, se vuelve a cargar.
 */
export function useResource<T>(load: () => Promise<T>, key: string, { retries = 2 }: { retries?: number } = {}): Resource<T> {
  const [state, setState] = useState<State<T>>({ settledKey: null, attempt: 0 });
  const [token, setToken] = useState(0);
  const requestKey = `${key}#${token}`;
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const controller = new AbortController();
    withRetry(() => loadRef.current(), {
      retries,
      signal: controller.signal,
      onRetry: (attempt) => {
        if (!controller.signal.aborted) setState((s) => ({ ...s, attempt }));
      },
    })
      .then((data) => {
        if (!controller.signal.aborted) setState({ settledKey: requestKey, data, attempt: 0 });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState((s) => ({ ...s, settledKey: requestKey, error: toApiError(error), attempt: 0 }));
      });
    return () => controller.abort();
  }, [requestKey, retries]);

  const reload = useCallback(() => setToken((t) => t + 1), []);
  const setData = useCallback((updater: (current: T | undefined) => T | undefined) => setState((s) => ({ ...s, data: updater(s.data) })), []);

  const settled = state.settledKey === requestKey;
  return {
    status: !settled ? "loading" : state.error ? "error" : "success",
    data: state.data,
    error: settled ? state.error : undefined,
    attempt: state.attempt,
    reload,
    setData,
  };
}

/** Promesa que nunca se resuelve: mantiene un recurso en "cargando" mientras falta una dependencia. */
export const pendingDependency = <T,>(): Promise<T> => new Promise<T>(() => {});
