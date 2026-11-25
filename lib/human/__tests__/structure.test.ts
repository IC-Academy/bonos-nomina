import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validateTxtStructure } from "../structure.ts";

const line = (amount = "100.00", batch = "") => {
  const cols = Array.from({ length: 20 }, () => "");
  cols[0] = "1000";
  cols[1] = "900001";
  cols[14] = amount;
  cols[19] = batch;
  return cols.join("\t");
};

describe("validateTxtStructure", () => {
  it("acepta un archivo correcto", () => {
    const report = validateTxtStructure([line("100.00", "L1"), line("5.50")].join("\r\n"));
    assert.equal(report.ok, true);
    assert.equal(report.lines, 2);
  });

  it("rechaza archivo vacío", () => {
    assert.equal(validateTxtStructure("").ok, false);
  });

  it("detecta saltos LF sin CR", () => {
    const report = validateTxtStructure([line("1.00", "L1"), line()].join("\n"));
    assert.equal(report.ok, false);
    assert.ok(report.issues.some((i) => i.message === "Saltos de línea distintos de CRLF"));
  });

  it("detecta columnas de más o de menos", () => {
    const report = validateTxtStructure(line("1.00", "L1") + "\textra");
    assert.deepEqual(report.issues, [{ line: 1, message: "Tiene 21 columnas; se esperan 20" }]);
  });

  it("detecta importe sin dos decimales", () => {
    const report = validateTxtStructure(line("100", "L1"));
    assert.equal(report.issues[0]!.message, 'Importe inválido en columna 15: "100"');
  });

  it("exige lote en la primera línea y no en las demás", () => {
    const report = validateTxtStructure([line("1.00"), line("1.00", "L1")].join("\r\n"));
    assert.deepEqual(
      report.issues.map((i) => i.line),
      [1, 2],
    );
  });

  it("con repeatBatch exige lote en todas las líneas", () => {
    const report = validateTxtStructure([line("1.00", "L1"), line("1.00")].join("\r\n"), { repeatBatch: true });
    assert.deepEqual(report.issues, [{ line: 2, message: "Falta lote en columna 20" }]);
  });

  it("marca CRLF final no esperado", () => {
    const report = validateTxtStructure(line("1.00", "L1") + "\r\n");
    assert.deepEqual(report.issues, [{ line: 0, message: "CRLF al final del archivo no esperado" }]);
  });

  it("reporta caracteres fuera de ISO-8859-1", () => {
    const cols = line("1.00", "L1").split("\t");
    cols[3] = "Bono — prueba";
    const report = validateTxtStructure(cols.join("\t"));
    assert.deepEqual(report.issues, [{ line: 1, message: "Carácter U+2014 en columna 4: fuera de ISO-8859-1" }]);
  });
});
