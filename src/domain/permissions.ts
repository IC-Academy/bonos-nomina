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
  | "matriz.administrar"
  | "validacion.excepcion"
  | "human.generar";

const MATRIX: Record<Role, Permission[]> = {
  "Super Admin": [
    "periodo.extender",
    "periodo.entregar",
    "validacion.decidir",
    "validacion.cerrar",
    "periodo.reabrir",
    "usuarios.administrar",
    "matriz.administrar",
    "validacion.excepcion",
    "human.generar",
  ],
  Admin: ["periodo.extender", "periodo.entregar", "validacion.decidir", "validacion.cerrar", "human.generar"],
  Usuario: ["periodo.entregar"],
};

export const permissionsFor = (role: Role): Permission[] => MATRIX[role];
