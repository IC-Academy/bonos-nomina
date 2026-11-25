import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { HumanLayoutError, buildHumanColumns, buildHumanFile, buildHumanTxt } from "../build-txt.ts";
import { Latin1EncodingError } from "../encoding.ts";
import { AMOUNT_COLUMN, BATCH_COLUMN, HUMAN_COLUMNS, HUMAN_LAYOUT_MAPPING_STATUS } from "../layout-spec.ts";
import { formatAmount } from "../text.ts";
import { validateTxtStructure } from "../structure.ts";
import { validateLayoutMovements } from "../validate-movements.ts";
import { MAPPINGS, input, record } from "./fixtures.ts";

const threeRecords = () =>
  input({
    records: [
      record({ id: "a", employeeNumber: "900001", installmentAmount: 500 }),
      record({ id: "b", employeeNumber: "900002", bonusType: "Bono prueba B", installmentAmount: 1234.5, authorizedTotal: 2000 }),
      record({ id: "c", employeeNumber: "900999" }), // fuera de la sábana: excluido
    ],
    selectedIds: ["a", "b", "c"],
  });

describe("especificación", () => {
  it("el mapeo de columnas sigue marcado como provisional", () => {
    assert.equal(HUMAN_LAYOUT_MAPPING_STATUS, "provisional");
  });

  it("define exactamente 20 columnas con índices consecutivos", () => {
    assert.equal(HUMAN_COLUMNS.length, 20);
    HUMAN_COLUMNS.forEach((c, i) => assert.equal(c.index, i));
    assert.equal(AMOUNT_COLUMN, 14);
    assert.equal(BATCH_COLUMN, 19);
  });
});

describe("formatAmount", () => {
  it("formatea con dos decimales", () => {
    assert.equal(formatAmount(500, 2), "500.00");
    assert.equal(formatAmount(1234.5, 2), "1234.50");
    assert.equal(formatAmount(0.1 + 0.2, 2), "0.30");
  });

  it("no redondea en silencio", () => {
    assert.throws(() => formatAmount(10.005, 2), RangeError);
    assert.throws(() => formatAmount(Number.POSITIVE_INFINITY, 2), RangeError);
  });
});

describe("buildHumanTxt", () => {
  it("genera una línea por movimiento incluido, con tabuladores y CRLF", () => {
    const movements = validateLayoutMovements(threeRecords());
    const txt = buildHumanTxt(movements, "SEM38-01", MAPPINGS);
    const lines = txt.split("\r\n");
    assert.equal(lines.length, 2);
    assert.ok(!txt.endsWith("\r\n"));
    const first = lines[0]!.split("\t");
    const second = lines[1]!.split("\t");
    assert.equal(first.length, 20);
    assert.equal(first[0], "1000");
    assert.equal(first[1], "900001");
    assert.equal(first[3], "Bono prueba A");
    assert.equal(first[4], "900001");
    assert.equal(first[14], "500.00");
    assert.equal(first[19], "SEM38-01");
    assert.equal(second[0], "2000");
    assert.equal(second[14], "1234.50");
    assert.equal(second[19], "", "v1: el lote solo va en la primera línea");
  });

  it("repite el lote en todas las líneas si algún concepto lo pide", () => {
    const movements = validateLayoutMovements(threeRecords());
    const mappings = MAPPINGS.map((m) => ({ ...m, repeatBatchOnEveryLine: true }));
    const lines = buildHumanTxt(movements, "L1", mappings).split("\r\n");
    assert.ok(lines.every((line) => line.split("\t")[19] === "L1"));
  });

  it("devuelve texto vacío si no hay incluidos", () => {
    const movements = validateLayoutMovements(input({ selectedIds: [] }));
    assert.equal(buildHumanTxt(movements, "L1", MAPPINGS), "");
  });

  it("rechaza campos con tabulador aunque se salten las validaciones", () => {
    const [movement] = validateLayoutMovements(input());
    const tampered = { ...movement!, record: { ...movement!.record, bonusType: "a\tb" } };
    assert.throws(() => buildHumanColumns(tampered, "L1", true, false), HumanLayoutError);
  });
});

describe("buildHumanFile", () => {
  it("produce bytes ISO-8859-1 y pasa la validación estructural", () => {
    const movements = validateLayoutMovements(threeRecords());
    const file = buildHumanFile(movements, "SEM38-01", MAPPINGS);
    assert.equal(file.lines, 2);
    assert.equal(file.bytes.length, file.text.length);
    const report = validateTxtStructure(file.text);
    assert.deepEqual(report.issues, []);
    assert.equal(report.ok, true);
  });

  it("codifica la ñ y los acentos de la descripción en un byte", () => {
    const mappings = [{ ...MAPPINGS[0]!, bonusTypes: ["Bono año"] }];
    const movements = validateLayoutMovements(input({ records: [record({ bonusType: "Bono año" })], conceptMappings: mappings }));
    const file = buildHumanFile(movements, "L1", mappings);
    assert.ok(file.bytes.includes(0xf1));
  });

  it("falla con detalle si hay un carácter incompatible", () => {
    const mappings = [{ ...MAPPINGS[0]!, bonusTypes: ["Bono “especial”"] }];
    const movements = validateLayoutMovements(
      input({ records: [record({ bonusType: "Bono “especial”" })], conceptMappings: mappings }),
    );
    assert.throws(
      () => buildHumanFile(movements, "L1", mappings),
      (error: unknown) => error instanceof Latin1EncodingError && error.problems.length === 2 && error.problems[0]!.column === 4,
    );
  });

  it("falla si no hay movimientos incluidos", () => {
    const movements = validateLayoutMovements(input({ selectedIds: [] }));
    assert.throws(() => buildHumanFile(movements, "L1", MAPPINGS), HumanLayoutError);
  });
});
