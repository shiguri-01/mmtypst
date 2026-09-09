import { describe, expect, test } from "vite-plus/test";

import { generateMathML, parse, tokenize, typstToMathML } from "../../src/index.ts";

describe("pipeline conversion", () => {
  test("tokenize returns array of tokens", () => {
    const tokens = tokenize("x + 1");
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
  });

  test("parse constructs AST from tokens", () => {
    const tokens = tokenize("x + 1");
    const ast = parse(tokens);
    expect(ast.type).toBe("BinaryOp");
  });

  test("generateMathML produces MathML string from AST", () => {
    const tokens = tokenize("x + 1");
    const ast = parse(tokens);
    const mathml = generateMathML(ast);
    expect(mathml).toContain("<math");
    expect(mathml).toContain("<mi>x</mi>");
  });

  test.each(["x + 1", "a\nb", '"a & b"', "a &= b \\ &= c"])(
    "direct and staged conversion agree for %s",
    (source) => {
      expect(typstToMathML(source)).toBe(generateMathML(parse(tokenize(source))));
    },
  );
});
