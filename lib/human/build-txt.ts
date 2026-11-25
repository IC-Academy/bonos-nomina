/**
 * Generación del TXT HUMAN.
 *
 * Recuperado de `buildHumanColumns` y `buildHumanTxt` (commit e253bba).
 * El orden de columnas viene de HUMAN_COLUMNS y es PROVISIONAL.
 */

import { HUMAN_COLUMNS, HUMAN_LAYOUT_FORMAT } from "./layout-spec.ts";
import { encodeLatin1 } from "./encoding.ts";
import { formatAmount } from "./text.ts";
import type { ConceptMapping, LayoutMovement } from "./types.ts";

export class HumanLayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HumanLayoutError";
  }
}

const assertNoStructuralCharacters = (value: string, column: number, movement: LayoutMovement) => {
  if (/[\t\r\n]/.test(value)) {
    throw new HumanLayoutError(
      `Registro ${movement.record.id}: la columna ${column + 1} contiene tabulador o salto de línea`,
    );
  }
};

/**
 * Construye las 20 columnas de un movimiento.
 * @param isFirstLine el lote se escribe en la primera línea, o en todas si repeatBatch.
 */
export const buildHumanColumns = (
  movement: LayoutMovement,
  batchId: string,
  isFirstLine: boolean,
  repeatBatch: boolean,
): string[] => {
  const columns = HUMAN_COLUMNS.map((spec): string => {
    switch (spec.source) {
      case "humanCode":
        return movement.humanCode;
      case "employeeNumber":
        return movement.record.employeeNumber;
      case "bonusType":
        return movement.record.bonusType;
      case "confirmedEmployee":
        return movement.confirmedEmployee;
      case "installmentAmount":
        return formatAmount(movement.record.installmentAmount, HUMAN_LAYOUT_FORMAT.amountDecimals);
      case "batchId":
        return isFirstLine || repeatBatch ? batchId : "";
      case "empty":
        return "";
    }
  });
  columns.forEach((value, index) => assertNoStructuralCharacters(value, index, movement));
  return columns;
};

/** Texto del TXT (sin codificar). Solo incluye movimientos con included = true. */
export const buildHumanTxt = (
  movements: LayoutMovement[],
  batchId: string,
  mappings: ConceptMapping[],
): string => {
  const repeatBatch = mappings.some((mapping) => mapping.repeatBatchOnEveryLine);
  const lines = movements
    .filter((movement) => movement.included)
    .map((movement, index) =>
      buildHumanColumns(movement, batchId, index === 0, repeatBatch).join(HUMAN_LAYOUT_FORMAT.separator),
    );
  if (lines.length === 0) return "";
  const body = lines.join(HUMAN_LAYOUT_FORMAT.lineEnding);
  return HUMAN_LAYOUT_FORMAT.trailingLineEnding ? body + HUMAN_LAYOUT_FORMAT.lineEnding : body;
};

export type HumanTxtFile = {
  text: string;
  bytes: Uint8Array;
  lines: number;
};

/**
 * Texto y bytes ISO-8859-1 listos para descargar.
 * Lanza Latin1EncodingError si hay caracteres incompatibles y HumanLayoutError
 * si no hay líneas que exportar.
 */
export const buildHumanFile = (
  movements: LayoutMovement[],
  batchId: string,
  mappings: ConceptMapping[],
): HumanTxtFile => {
  const text = buildHumanTxt(movements, batchId, mappings);
  if (!text) throw new HumanLayoutError("No hay movimientos incluidos para exportar");
  const bytes = encodeLatin1(text);
  const lines = text.split(HUMAN_LAYOUT_FORMAT.lineEnding).filter((line) => line.length > 0).length;
  return { text, bytes, lines };
};
