/**
 * DATOS FICTICIOS para el modo demo. No contienen nombres, números de empleado,
 * clientes ni importes reales. Sólo los importa el adaptador demo, que se carga
 * de forma diferida cuando DATA_MODE = "demo".
 */
import type { AppUser, BonusRule, CompareRange, ComparisonResult, Movement, Period } from "../../../domain/types";

export const demoPeriod: Period = {
  id: "DEMO-SEM-38",
  label: "SEM II 38",
  title: "Semana 38",
  version: 1,
  status: "validacion",
  deadlineLabel: "Cierre lunes · 14:00",
};

export const demoMovements: Movement[] = [
  { id: "B-038-001", employeeId: "E-10001", employeeName: "Colaborador Demo 01", bonus: "Ayuda de transporte", client: "Cliente A", site: "Instalación Norte", requested: 600, calculated: 500, hasSupport: true, status: "Revisión", attendanceDays: 5, attendanceMatched: 4, source: "SharePoint" },
  { id: "B-038-002", employeeId: "E-10002", employeeName: "Colaborador Demo 02", bonus: "Asistencia", client: "Operación semanal", site: "Instalación Centro", requested: 900, calculated: 900, hasSupport: true, status: "Cumple", attendanceDays: 5, attendanceMatched: 5, source: "SharePoint" },
  { id: "B-038-003", employeeId: "E-10003", employeeName: "Colaborador Demo 03", bonus: "Acciones destacadas", client: "Cliente demo", site: "Instalación Sur", requested: 1200, calculated: 1200, hasSupport: false, status: "Falta evidencia", attendanceDays: 0, attendanceMatched: 0, source: "Correo" },
  { id: "B-038-004", employeeId: "E-10004", employeeName: "Colaborador Demo 04", bonus: "Ayuda de transporte", client: "Cliente B", site: "Instalación Oriente", requested: 500, calculated: 540, hasSupport: true, status: "Revisión", attendanceDays: 5, attendanceMatched: 5, source: "SharePoint" },
];

/** Movimientos totales del layout semanal ficticio (la muestra UX tiene 4). */
export const demoTotalMovements = 236;

export const demoUsers: AppUser[] = [
  { id: "u-1", displayName: "Super Admin Demo", role: "Super Admin" },
  { id: "u-2", displayName: "Finanzas Demo", role: "Super Admin" },
  { id: "u-3", displayName: "Nóminas Demo 01", role: "Admin" },
  { id: "u-4", displayName: "Nóminas Demo 02", role: "Admin" },
  { id: "u-5", displayName: "Usuario ABM 01", role: "Usuario" },
];

export const demoRules: BonusRule[] = [
  { id: "R-1", bonus: "Ayuda de transporte", scope: "Cliente A · Instalación Norte", amountType: "NETO", periodicity: "Semanal", validation: "Asistencia + instalación", status: "Cumple" },
  { id: "R-2", bonus: "Acciones destacadas", scope: "General", amountType: "BRUTO", periodicity: "Según solicitud", validation: "Soporte + autorización", status: "Cumple" },
  { id: "R-3", bonus: "Asistencia", scope: "Según matriz", amountType: "BRUTO", periodicity: "Semana vencida", validation: "Asistencia + incidencias", status: "Revisión" },
];

export const demoComparablePeriods = ["Septiembre 2026", "Agosto 2026", "Julio 2026", "Junio 2026"];

const categories = (t: [number, number], a: [number, number], d: [number, number]) => [
  { name: "Ayuda de transporte", current: t[0], previous: t[1] },
  { name: "Asistencia", current: a[0], previous: a[1] },
  { name: "Acciones destacadas", current: d[0], previous: d[1] },
];

export const demoComparisons: Record<CompareRange, ComparisonResult> = {
  "Mes anterior": { reference: "Agosto 2026", amount: 428500, previousAmount: 391200, movements: 236, previousMovements: 218, approved: 218, previousApproved: 201, categories: categories([126400, 118900], [174300, 160800], [127800, 111500]) },
  Trimestre: { reference: "Abr–Jun 2026", amount: 1248600, previousAmount: 1174200, movements: 684, previousMovements: 641, approved: 638, previousApproved: 602, categories: categories([362700, 345100], [514800, 482600], [371100, 346500]) },
  Semestre: { reference: "Ene–Jun 2026", amount: 2487300, previousAmount: 2294100, movements: 1372, previousMovements: 1294, approved: 1281, previousApproved: 1207, categories: categories([721400, 674300], [1032900, 948200], [733000, 671600]) },
  Año: { reference: "Año 2025", amount: 4968400, previousAmount: 4512900, movements: 2741, previousMovements: 2538, approved: 2560, previousApproved: 2374, categories: categories([1438200, 1324800], [2064100, 1879300], [1466100, 1308800]) },
};
