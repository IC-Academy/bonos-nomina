import { toApiError } from "./errors";

export interface RetryOptions {
  /** Reintentos adicionales tras el primer intento. */
  retries?: number;
  /** Espera base en ms; crece de forma exponencial con algo de aleatoriedad. */
  baseDelayMs?: number;
  signal?: AbortSignal;
  onRetry?: (attempt: number, error: unknown) => void;
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });

/** Ejecuta `task` y reintenta sólo errores transitorios (red, timeout, 5xx). */
export async function withRetry<T>(task: () => Promise<T>, { retries = 2, baseDelayMs = 400, signal, onRetry }: RetryOptions = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      const apiError = toApiError(error);
      if (attempt >= retries || !apiError.retryable || signal?.aborted) throw apiError;
      onRetry?.(attempt + 1, apiError);
      await wait(baseDelayMs * 2 ** attempt + Math.random() * 100, signal);
    }
  }
}
