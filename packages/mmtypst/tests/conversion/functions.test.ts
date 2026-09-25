import { describe, expect, test } from "vite-plus/test";

import { renderMathML } from "../../src/index.ts";

describe("functions conversion", () => {
  describe("roots", () => {
    test("renders square root with sqrt function", () => {
      expect(renderMathML("sqrt(x)")).toContain("<msqrt><mi>x</mi></msqrt>");
    });

    test("renders n-th root with positional degree argument", () => {
      expect(renderMathML("root(3, x)")).toContain("<mroot><mi>x</mi><mn>3</mn></mroot>");
    });
  });

  describe("mathematical functions", () => {
    test("resolves a named symbol used as a callee", () => {
      expect(renderMathML("alpha(x)")).toContain('<mi>α</mi><mo fence="true">(</mo>');
      expect(renderMathML("sum(x)")).toContain('<mo>∑</mo><mo fence="true">(</mo>');
      expect(renderMathML("toString(x)", { symbols: {} })).toContain("<mi>toString</mi>");
    });
    test("renders functions in upright font in standalone position", () => {
      expect(renderMathML("sin x")).toContain('<mi mathvariant="normal">sin</mi>');
    });

    test("renders functions in upright font in call position", () => {
      expect(renderMathML("sin(x)")).toContain('<mi mathvariant="normal">sin</mi>');
    });
  });

  describe("fences and delimiters", () => {
    test("renders absolute value with vertical bars", () => {
      expect(renderMathML("abs(x)")).toContain(
        '<mrow><mo fence="true">|</mo><mi>x</mi><mo fence="true">|</mo></mrow>',
      );
    });

    test("renders round delimiters", () => {
      expect(renderMathML("round(x)")).toContain(
        '<mrow><mo fence="true">⌊</mo><mi>x</mi><mo fence="true">⌉</mo></mrow>',
      );
    });

    test("renders literal double brackets as fenced group", () => {
      expect(renderMathML("⟦x⟧")).toContain(
        '<mrow><mo fence="true">⟦</mo><mi>x</mi><mo fence="true">⟧</mo></mrow>',
      );
    });
  });

  describe("accents and decorations", () => {
    test("renders over-accents with mover accent=true", () => {
      expect(renderMathML("hat(x)")).toContain('<mover accent="true"><mi>x</mi><mo>^</mo></mover>');
    });

    test("renders overline and underline decorations", () => {
      expect(renderMathML("overline(A)")).toContain(
        '<mover accent="true"><mi>A</mi><mo>¯</mo></mover>',
      );
      expect(renderMathML("underline(B)")).toContain(
        '<munder accentunder="true"><mi>B</mi><mo>_</mo></munder>',
      );
    });

    test("renders overbrace and underbrace", () => {
      expect(renderMathML("overbrace(x)")).toContain("<mover><mi>x</mi><mo>⏞</mo></mover>");
      expect(renderMathML("underbrace(x)")).toContain("<munder><mi>x</mi><mo>⏟</mo></munder>");
    });
  });

  test("renders all variadic binomial arguments in fixed fraction slots", () => {
    const out = renderMathML("binom(n, k, j)");
    expect(out).toContain(
      '<mrow><mo>(</mo><mfrac linethickness="0"><mrow><mi>n</mi></mrow><mrow><mi>k</mi><mo>,</mo><mi>j</mi></mrow></mfrac><mo>)</mo></mrow>',
    );
  });
});
