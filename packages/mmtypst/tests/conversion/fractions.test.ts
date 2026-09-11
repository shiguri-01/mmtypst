import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("fractions conversion", () => {
  describe("slash division", () => {
    test("converts slash division to mfrac", () => {
      expect(typstToMathML("1 / 2")).toContain(
        "<mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac>",
      );
    });

    test("binds slash division tighter than prefix minus", () => {
      expect(typstToMathML("-a/b")).toContain(
        "<mrow><mo>−</mo><mfrac><mrow><mi>a</mi></mrow><mrow><mi>b</mi></mrow></mfrac></mrow>",
      );
    });
  });

  describe("parenthesis unwrapping", () => {
    test("unwraps matching outer parentheses on numerator and denominator", () => {
      const frac = typstToMathML("(a + b) / (c + d)");
      expect(frac).toContain(
        "<mfrac><mrow><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow></mrow><mrow><mrow><mi>c</mi><mo>+</mo><mi>d</mi></mrow></mrow></mfrac>",
      );
      expect(frac).not.toContain('<mo fence="true">(</mo>');
    });

    test("preserves inner parentheses when nested inside unwrapped parentheses", () => {
      const frac = typstToMathML("((x + 1)) / (y + 1)");
      expect(frac).toContain('<mo fence="true">(</mo>');
      expect(frac).toContain('<mo fence="true">)</mo>');
    });

    test("preserves square brackets in fraction terms", () => {
      const frac = typstToMathML("[a] / (b)");
      expect(frac).toContain('<mo fence="true">[</mo>');
      expect(frac).toContain('<mo fence="true">]</mo>');
      expect(frac).not.toContain('<mo fence="true">(</mo>');
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
