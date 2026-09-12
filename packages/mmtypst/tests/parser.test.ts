import { describe, expect, test } from "vite-plus/test";

import { tokenize } from "../src/lexer.ts";
import { parse } from "../src/parser.ts";

describe("parse", () => {
  test("long juxtaposition retains all nodes without recursive nesting", () => {
    const ast = parse(tokenize(Array(10000).fill("x").join(" ")));
    expect(ast.type).toBe("Row");
    if (ast.type === "Row") expect(ast.children).toHaveLength(10000);
  });

  test("parser diagnostics refer to the untrimmed source", () => {
    const ast = parse(tokenize("  x^"));
    expect(ast.type).toBe("Error");
    if (ast.type === "Error") {
      expect(ast.diagnostic?.type).toBe("CustomError");
      expect(ast.diagnostic?.position).toBeGreaterThanOrEqual(3);
    }
  });
});
