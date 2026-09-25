import { describe, expect, test } from "vite-plus/test";

import { renderMathML } from "../../src/index.ts";

describe("symbols conversion", () => {
  describe("Greek letters", () => {
    test("converts lowercase Greek letters", () => {
      const result = renderMathML("alpha + beta = gamma");
      expect(result).toContain("<mi>α</mi>");
    });
  });

  describe("arrows", () => {
    test("converts ASCII arrow shorthands to Unicode arrows", () => {
      expect(renderMathML("a -> b")).toContain("<mo>→</mo>");
    });
  });

  describe("relations and operators", () => {
    test("preserves direct Unicode mathematical operators identically to ASCII shorthands", () => {
      expect(renderMathML("a ≤ b")).toContain("<mo>≤</mo>");
    });

    test("renders Unicode relation atoms", () => {
      expect(renderMathML("x ≈ y")).toContain("<mrow><mi>x</mi><mo>≈</mo><mi>y</mi></mrow>");
    });
  });

  describe("miscellaneous symbols", () => {
    test("converts differential operators dif and Dif", () => {
      const integral = renderMathML("integral e^x dif x");
      expect(integral).toContain("<mo>∫</mo>");
      expect(integral).toContain("<mo>d</mo>");
    });
  });
});
