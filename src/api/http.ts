import { ApiError, kindFromStatus, toApiError } from "./errors";

/**
 * Transporte HTTP genérico para el futuro adaptador productivo.
 *
 * No contiene rutas: los endpoints reales los definirá el backend (Power
 * Automate / n8n / API intermedia). Este cliente sólo resuelve base URL, token,
 * timeout y traducción de errores para que cualquier adaptador los reutilice.
 */
export interface HttpClientOptions {
  baseUrl: string;
  /** Devuelve el token de acceso vigente (p. ej. MSAL / Entra ID). */
  getAccessToken?: () => Promise<string | null>;
  timeoutMs?: number;
}

export interface HttpClient {
  request<T>(operation: string, init: { method: string; path: string; body?: unknown; query?: Record<string, string | undefined> }): Promise<T>;
}

export function createHttpClient({ baseUrl, getAccessToken, timeoutMs = 15000 }: HttpClientOptions): HttpClient {
  return {
    async request<T>(operation: string, { method, path, body, query }: { method: string; path: string; body?: unknown; query?: Record<string, string | undefined> }) {
      const url = new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
      for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined) url.searchParams.set(key, value);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const token = await getAccessToken?.();
        const response = await fetch(url, {
          method,
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          throw new ApiError(kindFromStatus(response.status), detail || response.statusText, { status: response.status, operation });
        }
        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
      } catch (error) {
        throw toApiError(error, operation);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
