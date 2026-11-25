/**
 * Datos sintéticos para pruebas. No corresponden a empleados, clientes ni
 * importes reales. Los números de empleado usan el rango 900000–900999.
 */

import type { ConceptMapping, LayoutRecord, LayoutValidationInput, SupportDocument } from "../types.ts";

export const PERIOD = { id: "p-test-38", period: "SEM II 038" };

export const MAPPINGS: ConceptMapping[] = [
  {
    id: "c-1000",
    humanCode: "1000",
    humanConcept: "Concepto prueba A",
    bonusTypes: ["Bono prueba A"],
    active: true,
    repeatBatchOnEveryLine: false,
  },
  {
    id: "c-2000",
    humanCode: "2000",
    humanConcept: "Concepto prueba B",
    bonusTypes: ["Bono prueba B", "Bono prueba B bis"],
    active: true,
    repeatBatchOnEveryLine: false,
  },
  {
    id: "c-3000",
    humanCode: "3000",
    humanConcept: "Concepto inactivo",
    bonusTypes: ["Bono inactivo"],
    active: false,
    repeatBatchOnEveryLine: false,
  },
];

export const DOCS: SupportDocument[] = [
  { id: "d-1", periodId: PERIOD.id, name: "Autorizacion firmado prueba.pdf", status: "Firmado" },
];

export const record = (overrides: Partial<LayoutRecord> = {}): LayoutRecord => ({
  id: "r-1",
  periodId: PERIOD.id,
  payrollType: "Sem II",
  period: "SEM II 038",
  employeeNumber: "900001",
  bonusType: "Bono prueba A",
  authorizedTotal: 500,
  installmentAmount: 500,
  installmentNumber: 1,
  totalInstallments: 1,
  supports: ["Solicitud prueba.xlsx", "Autorizacion firmado.pdf"],
  ...overrides,
});

export const input = (overrides: Partial<LayoutValidationInput> = {}): LayoutValidationInput => ({
  period: PERIOD,
  records: [record()],
  selectedIds: ["r-1"],
  conceptMappings: MAPPINGS,
  employeeSheet: ["900001", "900002", "900003"],
  documents: DOCS,
  form: { batchId: "SEM38-01" },
  ...overrides,
});
