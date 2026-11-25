import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { compareWithAcceptedTxt } from "../compare.ts";
import { encodeLatin1 } from "../encoding.ts";

const cols = (values: Record<number, string>) =>
  Array.from({ length: 20 }, (_, i) => values[i] ?? "").join("\t");

describe("compareWithAcceptedTxt", () => {
  it("reporta archivos idénticos", () => {
    const bytes = encodeLatin1(cols({ 0: "1000", 14: "1.00" }));
    assert.equal(compareWithAcceptedTxt(bytes, bytes).identical, true);
  });

  it("señala las columnas que difieren", () => {
    const accepted = encodeLatin1(cols({ 0: "1000", 2: "900001", 14: "1.00" }));
    const generated = encodeLatin1(cols({ 0: "1000", 1: "900001", 14: "1.00" }));
    const report = compareWithAcceptedTxt(generated, accepted);
    assert.equal(report.identical, false);
    assert.deepEqual(report.columnsWithDifferences, [2, 3]);
    assert.deepEqual(report.columnDifferences[0], { line: 1, column: 2, expected: "", actual: "900001" });
  });

  it("detecta diferencias de saltos de línea y de número de líneas", () => {
    const a = cols({ 0: "1" });
    const accepted = encodeLatin1(`${a}\r\n${a}\r\n`);
    const generated = encodeLatin1(`${a}\n${a}\n${a}`);
    const report = compareWithAcceptedTxt(generated, accepted);
    assert.ok(report.fileIssues.includes("Saltos de línea: aceptado CRLF, generado LF"));
    assert.ok(report.fileIssues.includes("Salto de línea final: aceptado sí, generado no"));
    assert.ok(report.fileIssues.includes("Líneas: aceptado 2, generado 3"));
  });

  it("detecta columnas de más aunque estén vacías", () => {
    const accepted = encodeLatin1(cols({ 0: "1" }));
    const generated = encodeLatin1(cols({ 0: "1" }) + "\t");
    const report = compareWithAcceptedTxt(generated, accepted);
    assert.deepEqual(report.columnsWithDifferences, [21]);
  });
});
