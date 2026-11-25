/**
 * Validación estructural de un TXT HUMAN ya generado.
 *
 * Recuperado de `validateTxtStructure` (commit e253bba). Ahora devuelve la
 * lista de problemas por línea en lugar de un solo booleano, detecta saltos
 * de línea que no son CRLF y revisa la compatibilidad con ISO-8859-1.
 */

import { findIncompatibleCharacters } from "./encoding.ts";
import { AMOUNT_COLUMN, BATCH_COLUMN, HUMAN_LAYOUT_FORMAT } from "./layout-spec.ts";

export type StructureIssue = {
  /** Línea 1-based; 0 para problemas del archivo completo. */
  line: number;
  message: string;
};

export type StructureReport = {
  ok: boolean;
  lines: number;
  expectedColumns: number;
  issues: StructureIssue[];
};

export type StructureOptions = {
  /** Si es true, el lote debe ir en todas las líneas; si no, solo en la primera. */
  repeatBatch?: boolean;
};

const AMOUNT_PATTERN = new RegExp(`^\\d+\\.\\d{${HUMAN_LAYOUT_FORMAT.amountDecimals}}$`);

export const validateTxtStructure = (txt: string, options: StructureOptions = {}): StructureReport => {
  const { columnCount, separator, lineEnding } = HUMAN_LAYOUT_FORMAT;
  const issues: StructureIssue[] = [];

  if (!txt) {
    return { ok: false, lines: 0, expectedColumns: columnCount, issues: [{ line: 0, message: "Archivo vacío" }] };
  }

  // Un LF sin CR antes, o un CR sin LF después, rompe el formato CRLF.
  if (/(?<!\r)\n|\r(?!\n)/.test(txt)) {
    issues.push({ line: 0, message: "Saltos de línea distintos de CRLF" });
  }

  let body = txt;
  if (body.endsWith(lineEnding)) {
    if (!HUMAN_LAYOUT_FORMAT.trailingLineEnding) {
      issues.push({ line: 0, message: "CRLF al final del archivo no esperado" });
    }
    body = body.slice(0, -lineEnding.length);
  } else if (HUMAN_LAYOUT_FORMAT.trailingLineEnding) {
    issues.push({ line: 0, message: "Falta CRLF al final del archivo" });
  }

  const lines = body.split(lineEnding);
  lines.forEach((line, i) => {
    const n = i + 1;
    const columns = line.split(separator);
    if (columns.length !== columnCount) {
      issues.push({ line: n, message: `Tiene ${columns.length} columnas; se esperan ${columnCount}` });
      return;
    }
    const amount = columns[AMOUNT_COLUMN] ?? "";
    if (!AMOUNT_PATTERN.test(amount)) {
      issues.push({ line: n, message: `Importe inválido en columna ${AMOUNT_COLUMN + 1}: ${JSON.stringify(amount)}` });
    }
    const batch = columns[BATCH_COLUMN] ?? "";
    const batchRequired = i === 0 || options.repeatBatch === true;
    if (batchRequired && batch.trim().length === 0) {
      issues.push({ line: n, message: `Falta lote en columna ${BATCH_COLUMN + 1}` });
    }
    if (!batchRequired && batch !== "") {
      issues.push({ line: n, message: `Lote inesperado en columna ${BATCH_COLUMN + 1}` });
    }
  });

  for (const problem of findIncompatibleCharacters(txt)) {
    issues.push({
      line: problem.line,
      message: `Carácter ${problem.codePoint} en columna ${problem.column}: ${problem.reason}`,
    });
  }

  return { ok: issues.length === 0, lines: lines.length, expectedColumns: columnCount, issues };
};
