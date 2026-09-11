import { describe, expect, test } from "vite-plus/test";

import { tokenize } from "../src/lexer.ts";
import { parse } from "../src/parser.ts";

describe("parse", () => {
  test("treats ordinary newlines as whitespace", () => {
    expect(parse(tokenize("x\ny"))).toMatchObject({
      type: "Row",
      children: [{ type: "Ident" }, { type: "Ident" }],
    });
  });

  test("rejects incomplete fractions/scripts and malformed calls", () => {
    expect(parse(tokenize("1 /"))).toMatchObject({
      type: "Error",
      diagnostic: { type: "CustomError" },
    });
    expect(parse(tokenize("x^"))).toMatchObject({
      type: "Error",
      diagnostic: { type: "CustomError" },
    });
    expect(parse(tokenize("sqrt(x"))).toMatchObject({
      type: "Error",
      diagnostic: { type: "CustomError" },
    });
    expect(parse(tokenize("sqrt(x, y"))).toMatchObject({ type: "Error" });
  });

  test("long juxtaposition retains all nodes without recursive nesting", () => {
    const ast = parse(tokenize(Array(10000).fill("x").join(" ")));
    expect(ast.type).toBe("Row");
    if (ast.type === "Row") expect(ast.children).toHaveLength(10000);
  });

  test("parser diagnostics refer to the untrimmed source", () => {
    const ast = parse(tokenize("  x^"));
    expect(ast.type).toBe("Error");
    if (ast.type === "Error") {
      expect(ast.diagnostic).toBeDefined();
      expect(ast.diagnostic?.position).toBeGreaterThanOrEqual(3);
    }
  });
});
