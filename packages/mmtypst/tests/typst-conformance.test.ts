import { readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";

import { parse, tokenize } from "../src/index.ts";
import { resolveAST } from "../src/semantic.ts";
import { astTree, invalidSources, sources, type Tree } from "./typst-reference.ts";

const reference = JSON.parse(
  readFileSync(new URL("./fixtures/typst.json", import.meta.url), "utf8"),
) as { typst: string; valid: [string, Tree][]; invalid: string[] };

test("Typst fixtures cover the current corpus", () => {
  expect(reference.valid.map(([source]) => source)).toEqual(sources);
  expect(reference.invalid).toEqual(invalidSources);
});

describe("parser conformance with Typst", () => {
  test.each(reference.valid)("%s", (source, expected) => {
    expect(astTree(parse(tokenize(source)))).toEqual(expected);
  });
});

describe("invalid input agrees with Typst", () => {
  test.each(reference.invalid)("%s", (source) => {
    let tokens;
    try {
      tokens = tokenize(source);
    } catch (error) {
      expect(error).toBeInstanceOf(SyntaxError);
      return;
    }
    expect(resolveAST(parse(tokens)).type).toBe("Error");
  });
});
