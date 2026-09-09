import { describe, expect, test } from "vite-plus/test";

import { tokenize } from "../src/lexer.ts";

describe("tokenize", () => {
  test("retains diagnostics for unterminated strings and comments", () => {
    expect(() => tokenize('"unterminated')).toThrow(/offset 0/);
    expect(() => tokenize("x /* unterminated")).toThrow(/offset 2/);
  });
});
