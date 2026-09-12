import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("fractions conversion", () => {
  describe("slash division", () => {
    test("converts slash division to mfrac", () => {
      expect(typstToMathML("1 / 2")).toContain(
        "<mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac>",
      );
    });
  });

  describe("frac function", () => {
    test("renders explicit frac function", () => {
      expect(typstToMathML("frac(1, 1 + x)")).toContain(
        "<mfrac><mrow><mn>1</mn></mrow><mrow><mrow><mn>1</mn><mo>+</mo><mi>x</mi></mrow></mrow></mfrac>",
      );
    });
  });
});
