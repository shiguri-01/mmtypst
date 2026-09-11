import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("expressions conversion", () => {
  describe("operator atoms and attachments", () => {
    test("keeps minus before the attached atom", () => {
      expect(typstToMathML("-x^2")).toContain(
        "<mrow><mo>−</mo><msup><mi>x</mi><mn>2</mn></msup></mrow>",
      );
    });
  });

  describe("arithmetic and relation atoms", () => {
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
    test("keeps primes on the side of an operator with limits", () => {
      expect(typstToMathML("sum'_i^n", { display: "block" })).toContain(
        '<munderover><msup><mo movablelimits="false">∑</mo><mo>′</mo></msup><mi>i</mi><mi>n</mi></munderover>',
      );
    });
    test("renders factorial operator", () => {
      expect(typstToMathML("n!")).toContain("<mrow><mi>n</mi><mo>!</mo></mrow>");
    });

    test("keeps minus before the factorial expression", () => {
      expect(typstToMathML("-x!")).toContain(
        "<mrow><mo>−</mo><mrow><mi>x</mi><mo>!</mo></mrow></mrow>",
      );
    });

    test("binds factorial tighter than division", () => {
      expect(typstToMathML("n! / k!")).toContain(
        "<mfrac><mrow><mrow><mi>n</mi><mo>!</mo></mrow></mrow><mrow><mrow><mi>k</mi><mo>!</mo></mrow></mrow></mfrac>",
      );
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
