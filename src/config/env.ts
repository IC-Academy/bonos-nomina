/**
 * Configuración pública del frontend (sin secretos: todo lo que se pone aquí
 * termina en el bundle del navegador).
 *
 *  - VITE_DATA_MODE / NEXT_PUBLIC_DATA_MODE: "demo" (por defecto) o "api".
 *  - VITE_API_BASE_URL / NEXT_PUBLIC_API_BASE_URL: base del backend, cuando exista.
 */
export type DataMode = "demo" | "api";

type EnvRecord = Record<string, string | undefined>;

function readEnv(): EnvRecord {
  const viteEnv = (import.meta as unknown as { env?: EnvRecord }).env ?? {};
  const nodeEnv: EnvRecord = typeof process !== "undefined" && process.env ? (process.env as EnvRecord) : {};
  return { ...nodeEnv, ...viteEnv };
}

const env = readEnv();

const rawMode = (env.VITE_DATA_MODE ?? env.NEXT_PUBLIC_DATA_MODE ?? "demo").toLowerCase();

export const config = {
  dataMode: (rawMode === "api" ? "api" : "demo") as DataMode,
  apiBaseUrl: env.VITE_API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL ?? "",
};

export const isDemo = config.dataMode === "demo";
