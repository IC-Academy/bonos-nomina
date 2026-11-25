"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { config } from "../config/env";
import type { BonosApi } from "./contracts";
import { createUnconfiguredApi } from "./adapters/unconfigured";

const ApiContext = createContext<BonosApi | null>(null);

/**
 * Elige la implementación del contrato según DATA_MODE.
 * El adaptador demo (y sus datos ficticios) se importa de forma diferida, así
 * que el modo productivo no depende de él.
 */
async function loadApi(): Promise<BonosApi> {
  if (config.dataMode === "demo") {
    const { createDemoApi } = await import("./adapters/demo");
    return createDemoApi();
  }
  // Punto de integración: cuando exista backend, crear aquí el adaptador
  // productivo (p. ej. con createHttpClient de ./http) y devolverlo.
  return createUnconfiguredApi();
}

export function ApiProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [api, setApi] = useState<BonosApi | null>(null);
  useEffect(() => {
    let active = true;
    void loadApi().then((loaded) => {
      if (active) setApi(loaded);
    });
    return () => {
      active = false;
    };
  }, []);
  return api ? <ApiContext.Provider value={api}>{children}</ApiContext.Provider> : <>{fallback}</>;
}

export function useApi(): BonosApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useApi debe usarse dentro de <ApiProvider>.");
  return api;
}
