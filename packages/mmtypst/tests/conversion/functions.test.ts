import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("functions conversion", () => {
  describe("roots", () => {
    test("renders square root with sqrt function", () => {
      expect(typstToMathML("sqrt(x)")).toContain("<msqrt><mi>x</mi></msqrt>");
    });

    test("renders n-th root with positional degree argument", () => {
      expect(typstToMathML("root(3, x)")).toContain("<mroot><mi>x</mi><mn>3</mn></mroot>");
    });
  });

  describe("mathematical functions", () => {
    test("resolves a named symbol used as a callee", () => {
      expect(typstToMathML("alpha(x)")).toContain('<mi>α</mi><mo fence="true">(</mo>');
      expect(typstToMathML("sum(x)")).toContain('<mo>∑</mo><mo fence="true">(</mo>');
      expect(typstToMathML("toString(x)", { symbols: {} })).toContain("<mi>toString</mi>");
    });
    test("renders functions in upright font in standalone position", () => {
      expect(typstToMathML("sin x")).toContain('<mi mathvariant="normal">sin</mi>');
    });

    test("renders functions in upright font in call position", () => {
      expect(typstToMathML("sin(x)")).toContain('<mi mathvariant="normal">sin</mi>');
    });
  });

  describe("fences and delimiters", () => {
    test("renders absolute value with vertical bars", () => {
      expect(typstToMathML("abs(x)")).toContain(
        '<mrow><mo fence="true">|</mo><mi>x</mi><mo fence="true">|</mo></mrow>',
      );
    });

    test("renders round delimiters", () => {
      expect(typstToMathML("round(x)")).toContain(
        '<mrow><mo fence="true">⌊</mo><mi>x</mi><mo fence="true">⌉</mo></mrow>',
      );
    });

    test("renders literal double brackets as fenced group", () => {
      expect(typstToMathML("⟦x⟧")).toContain(
        '<mrow><mo fence="true">⟦</mo><mi>x</mi><mo fence="true">⟧</mo></mrow>',
      );
    });
  });

  describe("accents and decorations", () => {
    test("renders over-accents with mover accent=true", () => {
      expect(typstToMathML("hat(x)")).toContain(
        '<mover accent="true"><mi>x</mi><mo>^</mo></mover>',
      );
    });

    test("renders overline and underline decorations", () => {
      expect(typstToMathML("overline(A)")).toContain(
        '<mover accent="true"><mi>A</mi><mo>¯</mo></mover>',
      );
      expect(typstToMathML("underline(B)")).toContain(
        '<munder accentunder="true"><mi>B</mi><mo>_</mo></munder>',
      );
    });

    test("renders overbrace and underbrace", () => {
      expect(typstToMathML("overbrace(x)")).toContain("<mover><mi>x</mi><mo>⏞</mo></mover>");
      expect(typstToMathML("underbrace(x)")).toContain("<munder><mi>x</mi><mo>⏟</mo></munder>");
    });
  });

  test("renders all variadic binomial arguments in fixed fraction slots", () => {
    const out = typstToMathML("binom(n, k, j)");
    expect(out).toContain(
      '<mrow><mo>(</mo><mfrac linethickness="0"><mrow><mi>n</mi></mrow><mrow><mi>k</mi><mo>,</mo><mi>j</mi></mrow></mfrac><mo>)</mo></mrow>',
    );
  });
});
