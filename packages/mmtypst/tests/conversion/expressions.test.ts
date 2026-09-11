import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("expressions conversion", () => {
  describe("unary prefix and attachments", () => {
    test("binds attachments tighter than unary prefix minus", () => {
      expect(typstToMathML("-x^2")).toContain(
        "<mrow><mo>−</mo><msup><mi>x</mi><mn>2</mn></msup></mrow>",
      );
    });

    test("keeps a sign after an exponent marker as a separate atom", () => {
      expect(typstToMathML("x^-1")).toContain("<msup><mi>x</mi><mo>−</mo></msup><mn>1</mn>");
    });

    test("keeps a sign after a subscript marker as a separate atom", () => {
      expect(typstToMathML("x_-1")).toContain("<msub><mi>x</mi><mo>−</mo></msub><mn>1</mn>");
    });
  });

  describe("binary arithmetic and relations", () => {
    test("evaluates multiplication before addition", () => {
      expect(typstToMathML("a + b * c")).toContain(
        "<mrow><mi>a</mi><mo>+</mo><mrow><mi>b</mi><mo>⋅</mo><mi>c</mi></mrow></mrow>",
      );
    });

    test("evaluates addition before equality relation", () => {
      expect(typstToMathML("a = b + c")).toContain(
        "<mrow><mi>a</mi><mo>=</mo><mrow><mi>b</mi><mo>+</mo><mi>c</mi></mrow></mrow>",
      );
    });

    test("handles implicit multiplication via juxtaposition", () => {
      const implicit = typstToMathML("2 x + a b");
      expect(implicit).toContain("<mn>2</mn><mi>x</mi>");
      expect(implicit).toContain("<mi>a</mi><mi>b</mi>");
    });

    test("preserves explicit grouping parentheses", () => {
      const grouped = typstToMathML("(a + b) * c");
      expect(grouped).toContain('<mo fence="true">(</mo>');
      expect(grouped).toContain('<mo fence="true">)</mo>');
    });
  });

  describe("postfix operators", () => {
    test("renders factorial operator", () => {
      expect(typstToMathML("n!")).toContain("<mrow><mi>n</mi><mo>!</mo></mrow>");
    });

    test("binds factorial tighter than unary minus", () => {
      expect(typstToMathML("-x!")).toContain(
        "<mrow><mo>−</mo><mrow><mi>x</mi><mo>!</mo></mrow></mrow>",
      );
    });

    test("binds factorial tighter than division", () => {
      expect(typstToMathML("n! / k!")).toContain(
        "<mfrac><mrow><mrow><mi>n</mi><mo>!</mo></mrow></mrow><mrow><mrow><mi>k</mi><mo>!</mo></mrow></mrow></mfrac>",
      );
    });

    test("renders single and repeated primes", () => {
      expect(typstToMathML("f'")).toContain("<msup><mi>f</mi><mo>′</mo></msup>");
      expect(typstToMathML("f''")).toContain("<msup><mi>f</mi><mo>′′</mo></msup>");
    });

    test("renders primes with subscripts as multiscripts", () => {
      expect(typstToMathML("f'_1")).toContain("<msubsup><mi>f</mi><mn>1</mn><mo>′</mo></msubsup>");
    });
  });

  test("preserves legal visual tokens and unmatched literal delimiters", () => {
    expect(typstToMathML("a +")).not.toContain("<merror>");
    expect(typstToMathML("(x")).not.toContain('<mo fence="true">)</mo>');
    expect(typstToMathML("(x]")).toContain('<mo fence="true">]</mo>');
    expect(typstToMathML("n !")).not.toContain("<mrow><mi>n</mi><mo>!</mo></mrow></mrow>");
    expect(typstToMathML("root(index : 3, x)")).toContain("<mo>:</mo>");
  });
});
