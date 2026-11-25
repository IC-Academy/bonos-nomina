"use client";
import { useCallback, useState } from "react";
import { type ApiError, toApiError } from "../api/errors";

export type MutationResult<R> = { ok: true; data: R } | { ok: false; error: ApiError };

/**
 * Ejecuta una operación de escritura. No reintenta automáticamente (las
 * escrituras pueden no ser idempotentes); el usuario decide si repetir.
 */
export function useMutation<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | undefined>();

  const run = useCallback(
    async (...args: A): Promise<MutationResult<R>> => {
      setPending(true);
      setError(undefined);
      try {
        return { ok: true, data: await fn(...args) };
      } catch (e) {
        const apiError = toApiError(e);
        setError(apiError);
        return { ok: false, error: apiError };
      } finally {
        setPending(false);
      }
    },
    [fn],
  );

  return { run, pending, error };
}
