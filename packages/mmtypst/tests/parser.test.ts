import { describe, expect, test } from "vite-plus/test";

import { tokenize } from "../src/lexer.ts";
import { parse } from "../src/parser.ts";

describe("parse", () => {
  test("requires lexical adjacency for calls", () => {
    expect(parse(tokenize("f (x)"))).toMatchObject({ type: "Row" });
    expect(parse(tokenize("f(x)"))).toMatchObject({ type: "FunctionCall", name: "f" });
  });

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

  test("keeps signs after a fraction slash as separate math atoms", () => {
    expect(parse(tokenize("a/-b/c"))).toMatchObject({
      type: "Row",
      children: [
        {
          type: "Fraction",
          numerator: { type: "Ident", name: "a" },
          denominator: { type: "Operator", operator: "−" },
        },
        {
          type: "Fraction",
          numerator: { type: "Ident", name: "b" },
          denominator: { type: "Ident", name: "c" },
        },
      ],
    });
  });

  test("keeps signs after attachments as separate math atoms", () => {
    expect(parse(tokenize("a^-b^c"))).toMatchObject({
      type: "Row",
      children: [
        {
          type: "Attach",
          base: { type: "Ident", name: "a" },
          superscript: { type: "Operator", operator: "−" },
        },
        {
          type: "Attach",
          base: { type: "Ident", name: "b" },
          superscript: { type: "Ident", name: "c" },
        },
      ],
    });
  });

  test("allows mixed delimiters but leaves absent group closes empty", () => {
    expect(parse(tokenize("(x]"))).toMatchObject({ type: "Group", open: "(", close: "]" });
    expect(parse(tokenize("(x"))).toMatchObject({ type: "Group", open: "(", close: "" });
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
