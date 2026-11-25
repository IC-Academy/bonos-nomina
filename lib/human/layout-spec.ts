/**
 * Especificación del layout HUMAN.
 *
 * Las características de formato (20 columnas, tabulador, sin encabezados,
 * ISO-8859-1, CRLF, dos decimales) provienen del levantamiento con Nóminas.
 *
 * PROVISIONAL: el mapeo de campos a columnas proviene del commit e253bba y no
 * se ha comparado contra un TXT aceptado por HUMAN. No debe usarse para una
 * carga real hasta que `HUMAN_LAYOUT_MAPPING_STATUS` sea "validado".
 */

export const HUMAN_LAYOUT_MAPPING_STATUS: "provisional" | "validado" = "provisional";

export const HUMAN_LAYOUT_FORMAT = {
  columnCount: 20,
  separator: "\t",
  lineEnding: "\r\n",
  encoding: "ISO-8859-1",
  hasHeader: false,
  amountDecimals: 2,
  /**
   * PROVISIONAL: se desconoce si HUMAN espera CRLF después de la última línea.
   * v1 no lo agregaba; se conserva ese comportamiento.
   */
  trailingLineEnding: false,
} as const;

/** Campo que alimenta cada columna. */
export type HumanColumnSource =
  | "humanCode"
  | "employeeNumber"
  | "bonusType"
  | "confirmedEmployee"
  | "installmentAmount"
  | "batchId"
  | "empty";

export type HumanColumnSpec = {
  /** Posición 0-based en la línea. */
  index: number;
  source: HumanColumnSource;
  note: string;
};

/**
 * Mapeo PROVISIONAL de las 20 columnas (índices 0-based).
 * Columnas sin campo identificado quedan vacías.
 */
export const HUMAN_COLUMNS: readonly HumanColumnSpec[] = Array.from(
  { length: HUMAN_LAYOUT_FORMAT.columnCount },
  (_, index): HumanColumnSpec => {
    switch (index) {
      case 0:
        return { index, source: "humanCode", note: "Concepto HUMAN" };
      case 1:
        return { index, source: "employeeNumber", note: "Número de empleado" };
      case 3:
        return { index, source: "bonusType", note: "Descripción del bono" };
      case 4:
        return {
          index,
          source: "confirmedEmployee",
          note: "Número de empleado confirmado en la sábana (v1 lo repite; por confirmar)",
        };
      case 14:
        return { index, source: "installmentAmount", note: "Importe con dos decimales" };
      case 19:
        return {
          index,
          source: "batchId",
          note: "Lote; v1 lo escribe solo en la primera línea salvo repeatBatchOnEveryLine",
        };
      default:
        return { index, source: "empty", note: "Sin campo identificado" };
    }
  },
);

/** Índice de la columna que contiene el importe. */
export const AMOUNT_COLUMN = HUMAN_COLUMNS.find((c) => c.source === "installmentAmount")!.index;
/** Índice de la columna que contiene el lote. */
export const BATCH_COLUMN = HUMAN_COLUMNS.find((c) => c.source === "batchId")!.index;
