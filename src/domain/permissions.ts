import type { Role } from "./types";

/**
 * Permisos de interfaz. Sólo ocultan o deshabilitan controles: la autorización
 * real debe aplicarla el backend en cada operación.
 */
export type Permission =
  | "periodo.extender"
  | "periodo.entregar"
  | "validacion.decidir"
  | "validacion.cerrar"
  | "periodo.reabrir"
  | "usuarios.administrar"
  | "matriz.administrar";

const MATRIX: Record<Role, Permission[]> = {
  "Super Admin": [
    "periodo.extender",
    "periodo.entregar",
    "validacion.decidir",
    "validacion.cerrar",
    "periodo.reabrir",
    "usuarios.administrar",
    "matriz.administrar",
  ],
  Admin: ["periodo.extender", "periodo.entregar", "validacion.decidir", "validacion.cerrar", "matriz.administrar"],
  // Se conserva el comportamiento del prototipo. Pendiente de confirmar con
  // el negocio si "Usuario" debe poder decidir movimientos o editar la matriz
  // (la tabla de permisos de Administración dice "carga, consulta y entrega").
  Usuario: ["periodo.entregar", "validacion.decidir", "matriz.administrar"],
};

export const permissionsFor = (role: Role): Permission[] => MATRIX[role];
