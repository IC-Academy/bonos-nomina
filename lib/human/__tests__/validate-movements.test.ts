import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { findConceptMapping, validateLayoutMovements } from "../validate-movements.ts";
import { DOCS, MAPPINGS, PERIOD, input, record } from "./fixtures.ts";

const only = (overrides: Parameters<typeof input>[0]) => {
  const result = validateLayoutMovements(input(overrides));
  assert.equal(result.length, 1);
  return result[0]!;
};

describe("findConceptMapping", () => {
  it("homologa ignorando mayúsculas y acentos", () => {
    assert.equal(findConceptMapping({ bonusType: "  BONO PRUEBA b BIS " }, MAPPINGS)?.humanCode, "2000");
    assert.equal(findConceptMapping({ bonusType: "Bóno prueba A" }, MAPPINGS)?.humanCode, "1000");
  });

  it("ignora conceptos inactivos", () => {
    assert.equal(findConceptMapping({ bonusType: "Bono inactivo" }, MAPPINGS), undefined);
  });
});

describe("validateLayoutMovements", () => {
  it("incluye un registro válido y seleccionado", () => {
    const m = only({});
    assert.deepEqual(m.blockingErrors, []);
    assert.deepEqual(m.warnings, [], "SEM II 038 y SEM38-01 son el mismo número");
    assert.equal(m.included, true);
    assert.equal(m.humanCode, "1000");
    assert.equal(m.confirmedEmployee, "900001");
  });

  it("no incluye registros no seleccionados", () => {
    const m = only({ selectedIds: [] });
    assert.equal(m.included, false);
    assert.equal(m.exclusionReason, "No seleccionado");
  });

  it("filtra registros de otros periodos", () => {
    const result = validateLayoutMovements(input({ records: [record(), record({ id: "r-x", periodId: "otro" })] }));
    assert.deepEqual(
      result.map((m) => m.record.id),
      ["r-1"],
    );
  });

  const cases: [string, Parameters<typeof input>[0], string][] = [
    ["empleado vacío", { records: [record({ employeeNumber: "" })] }, "Número de empleado obligatorio"],
    [
      "empleado fuera de la sábana",
      { records: [record({ employeeNumber: "900999" })] },
      "Empleado no localizado en la sábana del periodo",
    ],
    ["concepto no homologado", { records: [record({ bonusType: "Bono desconocido" })] }, "Concepto Human no homologado"],
    ["importe cero", { records: [record({ installmentAmount: 0 })] }, "Importe numérico mayor que cero requerido"],
    ["importe negativo", { records: [record({ installmentAmount: -10 })] }, "Importe numérico mayor que cero requerido"],
    ["importe NaN", { records: [record({ installmentAmount: Number.NaN })] }, "Importe numérico mayor que cero requerido"],
    [
      "importe con 3 decimales",
      { records: [record({ installmentAmount: 100.005, authorizedTotal: 200 })] },
      "Importe con más de 2 decimales; no se redondea automáticamente",
    ],
    ["sin tipo de nómina", { records: [record({ payrollType: "" })] }, "Tipo de nómina definido requerido"],
    ["sin periodo", { records: [record({ period: "" })] }, "Periodo validado requerido"],
    [
      "parcialidad mayor al total",
      { records: [record({ installmentNumber: 3, totalInstallments: 2 })] },
      "Parcialidad inválida",
    ],
    [
      "importe mayor al autorizado",
      { records: [record({ installmentAmount: 600, authorizedTotal: 500 })] },
      "Parcialidad inválida",
    ],
    [
      "sin soporte",
      { records: [record({ supports: ["solo uno.pdf"] })], documents: [] },
      "Soporte disponible requerido",
    ],
    [
      "sin autorización",
      {
        records: [record({ supports: ["a.xlsx", "b.pdf"] })],
        documents: [{ id: "d", periodId: PERIOD.id, name: "otro.pdf", status: "Procesado" }],
      },
      "Autorización disponible requerida",
    ],
    ["sin lote", { form: { batchId: "   " } }, "Lote de Human obligatorio"],
    [
      "tabulador en la descripción",
      {
        records: [record({ bonusType: "Bono\tprueba A" })],
        conceptMappings: [{ ...MAPPINGS[0]!, bonusTypes: ["Bono\tprueba A"] }],
      },
      "Campo con tabulador o salto de línea",
    ],
    ["salto de línea en el lote", { form: { batchId: "SEM38\n01" } }, "Campo con tabulador o salto de línea"],
  ];

  for (const [name, overrides, expected] of cases) {
    it(`bloquea: ${name}`, () => {
      const m = only(overrides);
      assert.ok(m.blockingErrors.includes(expected), `esperaba «${expected}», obtuvo ${JSON.stringify(m.blockingErrors)}`);
      assert.equal(m.included, false);
    });
  }

  it("bloquea duplicados seleccionados y no los no seleccionados", () => {
    const a = record({ id: "a" });
    const b = record({ id: "b" });
    const both = validateLayoutMovements(input({ records: [a, b], selectedIds: ["a", "b"] }));
    assert.ok(both.every((m) => m.blockingErrors.includes("Registro duplicado para Human")));

    const one = validateLayoutMovements(input({ records: [a, b], selectedIds: ["a"] }));
    assert.equal(one[0]!.included, true);
  });

  it("no considera duplicado el mismo empleado con distinta parcialidad", () => {
    const a = record({ id: "a", installmentNumber: 1, totalInstallments: 2, installmentAmount: 250 });
    const b = record({ id: "b", installmentNumber: 2, totalInstallments: 2, installmentAmount: 250 });
    const result = validateLayoutMovements(input({ records: [a, b], selectedIds: ["a", "b"] }));
    assert.ok(result.every((m) => m.included));
  });

  it("acepta autorización por documento firmado del periodo", () => {
    const m = only({ records: [record({ supports: ["a.xlsx", "b.pdf"] })], documents: DOCS });
    assert.equal(m.included, true);
  });

  it("advierte cuando los números del lote y del periodo difieren", () => {
    const m = only({ form: { batchId: "SEM39-01" } });
    assert.equal(m.included, true);
    assert.deepEqual(m.warnings, ["El periodo seleccionado y el identificador del lote contienen números diferentes"]);
  });

  it("acepta importe con dos decimales", () => {
    const m = only({ records: [record({ installmentAmount: 123.45 })] });
    assert.equal(m.included, true);
  });
});
