/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { AppUser, Role } from "../../domain/types";

export interface Session {
  user: AppUser;
  role: Role;
  /** Fecha ISO de expiración del token, si aplica. */
  expiresAt?: string;
}

export interface SessionApi {
  /** Usuario autenticado y su rol efectivo. Debe fallar con `unauthorized` si no hay sesión. */
  getCurrentSession(): Promise<Session>;
  /** Cierra la sesión en el proveedor de identidad. */
  signOut(): Promise<void>;
}
