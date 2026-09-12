import { describe, expect, test } from "vite-plus/test";

import { tokenize } from "../src/lexer.ts";
import { parse } from "../src/parser.ts";

describe("parse", () => {
  test("long juxtaposition retains all nodes without recursive nesting", () => {
    const ast = parse(tokenize(Array(10000).fill("x").join(" ")));
    expect(ast.type).toBe("Row");
    if (ast.type === "Row") expect(ast.children).toHaveLength(10000);
  });
});
