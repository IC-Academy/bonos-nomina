/**
 * ESTADO: PROPUESTA — contrato que necesita el frontend, pendiente de validar con
 * el backend. No define rutas ni endpoints productivos.
 */
import type { AppUser, Role } from "../../domain/types";

export interface AdminApi {
  listUsers(): Promise<AppUser[]>;
  /** Alta de acceso. La identidad (correo/UPN) la resuelve el backend; no se guarda en el frontend. */
  addUser(input: { displayName: string; role: Role }): Promise<AppUser>;
  updateRole(userId: string, role: Role): Promise<AppUser>;
  removeUser(userId: string): Promise<void>;
}
