import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("symbols conversion", () => {
  describe("Greek letters", () => {
    test("converts lowercase Greek letters", () => {
      const result = typstToMathML("alpha + beta = gamma");
      expect(result).toContain("<mi>α</mi>");
    });
  });

  describe("arrows", () => {
    test("converts ASCII arrow shorthands to Unicode arrows", () => {
      expect(typstToMathML("a -> b")).toContain("<mo>→</mo>");
    });
  });

  describe("relations and operators", () => {
    test("preserves direct Unicode mathematical operators identically to ASCII shorthands", () => {
      expect(typstToMathML("a ≤ b")).toContain("<mo>≤</mo>");
    });

    test("renders Unicode relation atoms", () => {
      expect(typstToMathML("x ≈ y")).toContain("<mrow><mi>x</mi><mo>≈</mo><mi>y</mi></mrow>");
    });
  });

  describe("miscellaneous symbols", () => {
    test("converts differential operators dif and Dif", () => {
      const integral = typstToMathML("integral e^x dif x");
      expect(integral).toContain("<mo>∫</mo>");
      expect(integral).toContain("<mo>d</mo>");
    });
  });
});
