import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Latin1EncodingError, encodeLatin1, findIncompatibleCharacters } from "../encoding.ts";

describe("encodeLatin1", () => {
  it("codifica acentos y ñ como un byte ISO-8859-1", () => {
    const bytes = encodeLatin1("Ñandú\táé\r\n");
    assert.deepEqual([...bytes], [0xd1, 0x61, 0x6e, 0x64, 0xfa, 0x09, 0xe1, 0xe9, 0x0d, 0x0a]);
  });

  it("rechaza caracteres fuera de ISO-8859-1 en vez de sustituirlos por ?", () => {
    assert.throws(
      () => encodeLatin1("A\tguion – largo"),
      (error: unknown) => {
        assert.ok(error instanceof Latin1EncodingError);
        assert.equal(error.problems.length, 1);
        assert.deepEqual(error.problems[0], {
          char: "–",
          codePoint: "U+2013",
          line: 1,
          column: 2,
          offset: 8,
          reason: "fuera de ISO-8859-1",
        });
        return true;
      },
    );
  });

  it("rechaza emoji (par sustituto) como un solo carácter", () => {
    const problems = findIncompatibleCharacters("ok\r\nx😀");
    assert.equal(problems.length, 1);
    assert.equal(problems[0]!.codePoint, "U+1F600");
    assert.equal(problems[0]!.line, 2);
  });

  it("rechaza controles C0 y C1", () => {
    const problems = findIncompatibleCharacters("a\u0000b\u0085c\u007f");
    assert.deepEqual(
      problems.map((p) => [p.codePoint, p.reason]),
      [
        ["U+0000", "carácter de control"],
        ["U+0085", "carácter de control"],
        ["U+007F", "carácter de control"],
      ],
    );
  });

  it("acepta todo el rango imprimible de Latin-1", () => {
    let text = "";
    for (let c = 0x20; c <= 0x7e; c += 1) text += String.fromCharCode(c);
    for (let c = 0xa0; c <= 0xff; c += 1) text += String.fromCharCode(c);
    assert.equal(encodeLatin1(text).length, text.length);
  });
});
