export type ApiErrorKind =
  | "network" // sin conexión / CORS / DNS
  | "timeout"
  | "unauthorized" // 401: sesión vencida o inexistente
  | "forbidden" // 403: rol sin permiso
  | "not_found"
  | "conflict" // 409: p. ej. periodo cerrado o versión desactualizada
  | "validation" // 400/422
  | "server" // 5xx
  | "not_configured"; // la operación aún no tiene backend productivo

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Operación del contrato que falló, p. ej. "movements.list". */
  readonly operation?: string;

  constructor(kind: ApiErrorKind, message: string, options: { status?: number; operation?: string; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
    this.operation = options.operation;
  }

  /** Sólo los fallos transitorios se reintentan automáticamente. */
  get retryable(): boolean {
    return this.kind === "network" || this.kind === "timeout" || this.kind === "server";
  }
}

export function toApiError(error: unknown, operation?: string): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError("timeout", "La solicitud tardó demasiado.", { operation, cause: error });
  }
  if (error instanceof TypeError) {
    return new ApiError("network", "No fue posible conectar con el servicio.", { operation, cause: error });
  }
  return new ApiError("server", error instanceof Error ? error.message : "Error inesperado.", { operation, cause: error });
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
  return "server";
}

/** Mensaje en español para mostrar al usuario final. */
export function userMessage(error: unknown): string {
  const e = toApiError(error);
  switch (e.kind) {
    case "network":
      return "Sin conexión con el servicio. Revisa tu red e inténtalo de nuevo.";
    case "timeout":
      return "El servicio tardó demasiado en responder.";
    case "unauthorized":
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    case "forbidden":
      return "Tu rol no tiene permiso para esta acción.";
    case "not_found":
      return "El registro ya no existe o fue movido.";
    case "conflict":
      return e.message || "El registro cambió mientras trabajabas. Recarga la información.";
    case "validation":
      return e.message || "Los datos enviados no son válidos.";
    case "not_configured":
      return e.message;
    default:
      return "Ocurrió un error en el servicio. Inténtalo de nuevo.";
  }
}
