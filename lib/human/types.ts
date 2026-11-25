/**
 * Tipos del dominio para la generación del layout HUMAN.
 *
 * Origen: recuperados del commit e253bba (app/page.tsx) y desacoplados del
 * estado de React. Solo contienen los campos que usan las validaciones y el
 * generador; el resto del modelo lo define el contrato API.
 */

/** Registro individual de bono que puede llegar al layout. */
export type LayoutRecord = {
  id: string;
  periodId: string;
  /** Tipo de nómina, p. ej. "Qna", "Sem II", "IC ADMIN", "Reclamos". */
  payrollType: string;
  /** Periodo de nómina en texto, p. ej. "SEM II 038". */
  period: string;
  employeeNumber: string;
  /** Descripción del bono; se homologa contra ConceptMapping.bonusTypes. */
  bonusType: string;
  /** Importe total autorizado para la parcialidad completa. */
  authorizedTotal: number;
  /** Importe de esta parcialidad; es el que se exporta. */
  installmentAmount: number;
  installmentNumber: number;
  totalInstallments: number;
  /** Nombres de los soportes asociados al registro. */
  supports: string[];
};

/** Homologación entre descripciones de bono y concepto HUMAN. */
export type ConceptMapping = {
  id: string;
  humanCode: string;
  humanConcept: string;
  bonusTypes: string[];
  active: boolean;
  /** Si es true, el lote se repite en todas las líneas del TXT. */
  repeatBatchOnEveryLine: boolean;
};

export type SupportDocumentStatus = "Procesado" | "Pendiente" | "No procesado" | "Firmado";

/** Documento de soporte asociado al periodo. */
export type SupportDocument = {
  id: string;
  periodId: string;
  name: string;
  status: SupportDocumentStatus;
};

/** Periodo que se está exportando. */
export type LayoutPeriod = {
  id: string;
  period: string;
};

/** Datos que captura Nóminas al generar el layout. */
export type LayoutForm = {
  /** Identificador del lote HUMAN, asignado manualmente por Nóminas. */
  batchId: string;
};

/** Todo lo que necesita el motor para decidir qué registros se exportan. */
export type LayoutValidationInput = {
  period: LayoutPeriod;
  /** Registros de todos los periodos; se filtran por period.id. */
  records: LayoutRecord[];
  /** Registros que el usuario seleccionó para exportar. */
  selectedIds: string[];
  conceptMappings: ConceptMapping[];
  /** Números de empleado presentes en la sábana del periodo. */
  employeeSheet: string[];
  documents: SupportDocument[];
  form: LayoutForm;
};

/** Resultado de validar un registro para el layout. */
export type LayoutMovement = {
  record: LayoutRecord;
  selected: boolean;
  humanCode: string;
  humanConcept: string;
  /** Número de empleado confirmado en la sábana; vacío si no se encontró. */
  confirmedEmployee: string;
  blockingErrors: string[];
  warnings: string[];
  /** true solo si está seleccionado y no tiene errores bloqueantes. */
  included: boolean;
  exclusionReason: string;
};
