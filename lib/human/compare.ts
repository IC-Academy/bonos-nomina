/**
 * Comparación de un TXT generado contra un TXT histórico aceptado por HUMAN.
 *
 * Sirve para validar el mapeo provisional de columnas: cuando ambos archivos
 * describen los mismos movimientos, cada diferencia indica una columna mal
 * mapeada, un formato distinto o un valor constante faltante.
 * Trabaja sobre bytes para detectar también diferencias de codificación y de
 * saltos de línea. No guarda ni envía el contenido.
 */

import { HUMAN_LAYOUT_FORMAT } from "./layout-spec.ts";

export type ColumnDifference = {
  /** Línea 1-based. */
  line: number;
  /** Columna 1-based. */
  column: number;
  expected: string;
  actual: string;
};

export type ComparisonReport = {
  identical: boolean;
  /** Diferencias a nivel archivo (bytes, saltos de línea, número de líneas). */
  fileIssues: string[];
  columnDifferences: ColumnDifference[];
  /** Columnas (1-based) con al menos una diferencia, ordenadas. */
  columnsWithDifferences: number[];
};

const decodeLatin1 = (bytes: Uint8Array) => {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return text;
};

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((value, i) => value === b[i]);

const splitLines = (text: string) => text.split(/\r\n|\n|\r/).filter((line, i, all) => !(i === all.length - 1 && line === ""));

export const compareWithAcceptedTxt = (generated: Uint8Array, accepted: Uint8Array): ComparisonReport => {
  if (sameBytes(generated, accepted)) {
    return { identical: true, fileIssues: [], columnDifferences: [], columnsWithDifferences: [] };
  }
  const fileIssues: string[] = [];
  const gen = decodeLatin1(generated);
  const acc = decodeLatin1(accepted);

  const crlf = (text: string) => text.includes("\r\n");
  if (crlf(acc) !== crlf(gen)) {
    fileIssues.push(`Saltos de línea: aceptado ${crlf(acc) ? "CRLF" : "LF"}, generado ${crlf(gen) ? "CRLF" : "LF"}`);
  }
  const endsWithBreak = (text: string) => /\r?\n$/.test(text);
  if (endsWithBreak(acc) !== endsWithBreak(gen)) {
    fileIssues.push(
      `Salto de línea final: aceptado ${endsWithBreak(acc) ? "sí" : "no"}, generado ${endsWithBreak(gen) ? "sí" : "no"}`,
    );
  }

  const accLines = splitLines(acc);
  const genLines = splitLines(gen);
  if (accLines.length !== genLines.length) {
    fileIssues.push(`Líneas: aceptado ${accLines.length}, generado ${genLines.length}`);
  }

  const columnDifferences: ColumnDifference[] = [];
  const lines = Math.min(accLines.length, genLines.length);
  for (let i = 0; i < lines; i += 1) {
    const expectedCols = accLines[i]!.split(HUMAN_LAYOUT_FORMAT.separator);
    const actualCols = genLines[i]!.split(HUMAN_LAYOUT_FORMAT.separator);
    const width = Math.max(expectedCols.length, actualCols.length);
    for (let c = 0; c < width; c += 1) {
      const expected = expectedCols[c] ?? "";
      const actual = actualCols[c] ?? "";
      if (expected !== actual || (c >= expectedCols.length) !== (c >= actualCols.length)) {
        columnDifferences.push({ line: i + 1, column: c + 1, expected, actual });
      }
    }
  }

  const columnsWithDifferences = [...new Set(columnDifferences.map((d) => d.column))].sort((a, b) => a - b);
  if (fileIssues.length === 0 && columnDifferences.length === 0) {
    fileIssues.push("Los archivos difieren en bytes no visibles por columna");
  }
  return { identical: false, fileIssues, columnDifferences, columnsWithDifferences };
};
