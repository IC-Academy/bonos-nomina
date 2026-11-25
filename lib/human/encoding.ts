/**
 * Codificación ISO-8859-1 estricta para el TXT HUMAN.
 *
 * v1 (commit e253bba) sustituía en silencio por "?" cualquier carácter fuera
 * de Latin-1. Aquí se reemplaza por una validación explícita: si hay un
 * carácter incompatible, se reporta su ubicación y no se genera el archivo.
 */

export type IncompatibleCharacter = {
  /** Carácter tal como aparece en el texto. */
  char: string;
  /** Código Unicode, p. ej. "U+2013". */
  codePoint: string;
  /** Línea 1-based. */
  line: number;
  /** Columna del layout 1-based (separada por tabulador). */
  column: number;
  /** Posición 0-based en el texto completo (unidades UTF-16). */
  offset: number;
  reason: "fuera de ISO-8859-1" | "carácter de control";
};

const formatCodePoint = (code: number) => `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;

/**
 * Clasifica un código Unicode para el TXT:
 * - TAB, LF y CR se permiten (estructura del archivo).
 * - 0x20–0x7E y 0xA0–0xFF: imprimibles de ISO-8859-1.
 * - 0x00–0x1F (salvo los anteriores), 0x7F y 0x80–0x9F: controles, se rechazan.
 * - > 0xFF: no representable en ISO-8859-1.
 */
const classify = (code: number): IncompatibleCharacter["reason"] | null => {
  if (code === 9 || code === 10 || code === 13) return null;
  if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) return null;
  if (code > 0xff) return "fuera de ISO-8859-1";
  return "carácter de control";
};

/** Lista todos los caracteres que no pueden ir en el TXT. Vacía si todo es válido. */
export const findIncompatibleCharacters = (content: string): IncompatibleCharacter[] => {
  const problems: IncompatibleCharacter[] = [];
  let line = 1;
  let column = 1;
  let offset = 0;
  for (const char of content) {
    const code = char.codePointAt(0)!;
    const reason = classify(code);
    if (reason) {
      problems.push({ char, codePoint: formatCodePoint(code), line, column, offset, reason });
    }
    if (char === "\n") {
      line += 1;
      column = 1;
    } else if (char === "\t") {
      column += 1;
    }
    offset += char.length;
  }
  return problems;
};

export class Latin1EncodingError extends Error {
  readonly problems: IncompatibleCharacter[];

  constructor(problems: IncompatibleCharacter[]) {
    const preview = problems
      .slice(0, 5)
      .map((p) => `línea ${p.line}, columna ${p.column}: ${JSON.stringify(p.char)} ${p.codePoint} (${p.reason})`)
      .join("; ");
    const more = problems.length > 5 ? ` y ${problems.length - 5} más` : "";
    super(`El TXT contiene ${problems.length} carácter(es) incompatibles con ISO-8859-1: ${preview}${more}`);
    this.name = "Latin1EncodingError";
    this.problems = problems;
  }
}

/**
 * Convierte el texto a bytes ISO-8859-1.
 * Lanza Latin1EncodingError si algún carácter no es representable; nunca sustituye.
 */
export const encodeLatin1 = (content: string): Uint8Array => {
  const problems = findIncompatibleCharacters(content);
  if (problems.length > 0) throw new Latin1EncodingError(problems);
  const bytes = new Uint8Array(content.length);
  for (let i = 0; i < content.length; i += 1) bytes[i] = content.charCodeAt(i);
  return bytes;
};
