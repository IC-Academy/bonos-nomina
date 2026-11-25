/**
 * Validación de registros antes de generar el layout HUMAN.
 *
 * Recuperado de `validateLayoutMovements` (commit e253bba) sin dependencia de
 * React ni del estado demo. Las reglas son las de v1; las que no estén
 * confirmadas por Nóminas deben revisarse contra la especificación de reglas.
 *
 * Cambios respecto a v1:
 * - Recibe la sábana y los documentos como parámetros en lugar del estado demo.
 * - Agrega dos reglas explícitas para no redondear ni corromper el archivo:
 *   importes con más de 2 decimales y campos con tabulador o salto de línea.
 * - La advertencia de lote compara los números como enteros: en v1 "038" y
 *   "38" se marcaban como diferentes.
 */

import { HUMAN_LAYOUT_FORMAT } from "./layout-spec.ts";
import { extractDigits, hasAtMostDecimals, normalizeText } from "./text.ts";
import type {
  ConceptMapping,
  LayoutMovement,
  LayoutRecord,
  LayoutValidationInput,
  SupportDocument,
} from "./types.ts";

export const findConceptMapping = (
  record: Pick<LayoutRecord, "bonusType">,
  mappings: ConceptMapping[],
): ConceptMapping | undefined =>
  mappings.find(
    (mapping) =>
      mapping.active && mapping.bonusTypes.some((type) => normalizeText(type) === normalizeText(record.bonusType)),
  );

/**
 * Llave de duplicidad de v1: tipo de nómina, periodo, empleado, concepto,
 * descripción, importe y parcialidad. Dos registros con la misma llave en una
 * misma exportación se bloquean.
 */
export const duplicateKey = (record: LayoutRecord, mappings: ConceptMapping[]): string =>
  [
    record.payrollType,
    record.period,
    record.employeeNumber,
    findConceptMapping(record, mappings)?.humanCode ?? "",
    normalizeText(record.bonusType),
    Number.isFinite(record.installmentAmount) ? record.installmentAmount.toFixed(2) : String(record.installmentAmount),
    record.installmentNumber,
    record.totalInstallments,
  ].join("|");

const hasStructuralCharacters = (value: string) => /[\t\r\n]/.test(value);

const supportStatus = (record: LayoutRecord, docs: SupportDocument[]) => {
  const hasSupport =
    record.supports.length > 1 ||
    docs.some((document) => document.status === "Procesado" || document.status === "Firmado");
  const hasAuthorization =
    record.supports.some((support) => normalizeText(support).includes("firmado")) ||
    docs.some((document) => document.status === "Firmado" || normalizeText(document.name).includes("firmado"));
  return { hasSupport, hasAuthorization };
};

export const validateLayoutMovements = (input: LayoutValidationInput): LayoutMovement[] => {
  const { period, conceptMappings, employeeSheet, form } = input;
  const records = input.records.filter((record) => record.periodId === period.id);
  const selectedIds = new Set(input.selectedIds);
  const docs = input.documents.filter((document) => document.periodId === period.id);
  const sheet = new Set(employeeSheet);

  const duplicateCounts = new Map<string, number>();
  for (const record of records) {
    if (!selectedIds.has(record.id)) continue;
    const key = duplicateKey(record, conceptMappings);
    duplicateCounts.set(key, (duplicateCounts.get(key) ?? 0) + 1);
  }

  return records.map((record): LayoutMovement => {
    const selected = selectedIds.has(record.id);
    const mapping = findConceptMapping(record, conceptMappings);
    const confirmedEmployee = sheet.has(record.employeeNumber) ? record.employeeNumber : "";
    const { hasSupport, hasAuthorization } = supportStatus(record, docs);
    const amountIsNumber = Number.isFinite(record.installmentAmount);
    const partialityOk =
      record.installmentNumber > 0 &&
      record.totalInstallments > 0 &&
      record.installmentNumber <= record.totalInstallments &&
      record.installmentAmount <= record.authorizedTotal;
    const textFields = [record.employeeNumber, record.bonusType, mapping?.humanCode ?? "", form.batchId];

    const blockingErrors = [
      !record.employeeNumber && "Número de empleado obligatorio",
      record.employeeNumber && !confirmedEmployee && "Empleado no localizado en la sábana del periodo",
      !mapping && "Concepto Human no homologado",
      !record.bonusType && "Descripción del bono obligatoria",
      (!amountIsNumber || record.installmentAmount <= 0) && "Importe numérico mayor que cero requerido",
      amountIsNumber &&
        !hasAtMostDecimals(record.installmentAmount, HUMAN_LAYOUT_FORMAT.amountDecimals) &&
        `Importe con más de ${HUMAN_LAYOUT_FORMAT.amountDecimals} decimales; no se redondea automáticamente`,
      !record.payrollType && "Tipo de nómina definido requerido",
      !record.period && "Periodo validado requerido",
      (duplicateCounts.get(duplicateKey(record, conceptMappings)) ?? 0) > 1 && "Registro duplicado para Human",
      !partialityOk && "Parcialidad inválida",
      !hasSupport && "Soporte disponible requerido",
      !hasAuthorization && "Autorización disponible requerida",
      !form.batchId.trim() && "Lote de Human obligatorio",
      textFields.some(hasStructuralCharacters) && "Campo con tabulador o salto de línea",
    ].filter((value): value is string => typeof value === "string" && value.length > 0);

    const periodDigits = extractDigits(period.period);
    const batchDigits = extractDigits(form.batchId);
    const warnings = [
      periodDigits &&
        batchDigits &&
        Number(periodDigits) !== Number(batchDigits) &&
        "El periodo seleccionado y el identificador del lote contienen números diferentes",
    ].filter((value): value is string => typeof value === "string" && value.length > 0);

    const included = selected && blockingErrors.length === 0;
    return {
      record,
      selected,
      humanCode: mapping?.humanCode ?? "",
      humanConcept: mapping?.humanConcept ?? record.bonusType,
      confirmedEmployee,
      blockingErrors,
      warnings,
      included,
      exclusionReason: !selected ? "No seleccionado" : blockingErrors.join("; "),
    };
  });
};
