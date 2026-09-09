import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("attachments conversion", () => {
  describe("subscripts and superscripts", () => {
    test("attaches subscript with underscore", () => {
      expect(typstToMathML("x_1")).toContain("<msub><mi>x</mi><mn>1</mn></msub>");
    });

    test("attaches superscript with caret", () => {
      expect(typstToMathML("x^2")).toContain("<msup><mi>x</mi><mn>2</mn></msup>");
    });

    test("attaches both subscript and superscript using msubsup", () => {
      expect(typstToMathML("x_1^2")).toContain("<msubsup><mi>x</mi><mn>1</mn><mn>2</mn></msubsup>");
    });
  });

  describe("grouping delimiters in scripts", () => {
    test("omits round parentheses in script terms while preserving base grouping", () => {
      const sub = typstToMathML("(x)_(y)");
      expect(sub).toContain('<mo fence="true">(</mo><mi>x</mi><mo fence="true">)</mo>');
      expect(sub).not.toContain('<mo fence="true">(</mo><mi>y</mi><mo fence="true">)</mo>');
    });

    test("omits round parentheses in compound exponent expressions", () => {
      const sup = typstToMathML("x^(a + b)");
      expect(sup).toContain("<msup><mi>x</mi><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow></msup>");
      expect(sup).not.toContain('<mo fence="true">(</mo>');
    });

    test("preserves square brackets in scripts", () => {
      expect(typstToMathML("x^[y]")).toContain(
        '<mo fence="true">[</mo><mi>y</mi><mo fence="true">]</mo>',
      );
    });

    test("preserves curly braces in scripts", () => {
      expect(typstToMathML("x^{y}")).toContain(
        '<mo fence="true">{</mo><mi>y</mi><mo fence="true">}</mo>',
      );
    });
  });

  describe("large operators and limits", () => {
    test("renders limits above and below with munderover in block display mode", () => {
      const blockSum = typstToMathML("sum_(i=1)^n i", { display: "block" });
      expect(blockSum).toContain("<munderover>");
      expect(blockSum).toContain('<mo movablelimits="false">∑</mo>');
    });

    test("renders limits as scripts with msubsup in inline display mode", () => {
      const inlineSum = typstToMathML("sum_(i=1)^n i", { display: "inline" });
      expect(inlineSum).toContain("<msubsup>");
      expect(inlineSum).toContain("<mo>∑</mo>");
    });

    test("forces limits placement without changing display size", () => {
      const output = typstToMathML("limits(sum)_0^n");
      expect(output).toContain("<munderover>");
      expect(output).not.toContain("displaystyle=");
    });

    test("forces side scripts without changing display size", () => {
      const output = typstToMathML("scripts(sum)_0^n", { display: "block" });
      expect(output).toContain("<msubsup>");
      expect(output).not.toContain("displaystyle=");
    });
  });

  describe("attach function", () => {
    test("renders multi-scripts with MathML Core empty slot mrow placeholder", () => {
      const multi = typstToMathML("attach(A, t: 1, bl: 2)");
      expect(multi).toContain("<mmultiscripts>");
      expect(multi).toContain("<mprescripts/>");
      expect(multi).toContain("<mrow/>");
      expect(multi).not.toContain("<none/>");
    });
  });

  test("nested attachments associate right and opposite attachments chain", () => {
    expect(typstToMathML("x^y^z")).toBe(
      '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><msup><mi>x</mi><msup><mi>y</mi><mi>z</mi></msup></msup></math>',
    );
    expect(typstToMathML("x_1^2")).toBe(
      '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><msubsup><mi>x</mi><mn>1</mn><mn>2</mn></msubsup></math>',
    );
  });

  test("retains all six attachment arguments", () => {
    const output = typstToMathML("attach(limits(A), t:1, tr:2, b:3, br:4, tl:5, bl:6)");
    expect(output).toBe(
      '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mmultiscripts><munderover><mi>A</mi><mn>3</mn><mn>1</mn></munderover><mn>4</mn><mn>2</mn><mprescripts/><mn>6</mn><mn>5</mn></mmultiscripts></math>',
    );
  });

  test("display context and explicit placement are independent", () => {
    const forced = typstToMathML("limits(sum)_0^n");
    expect(forced).toContain('<munderover><mo movablelimits="false">∑</mo>');
    expect(forced).not.toContain("displaystyle=");
    expect(typstToMathML("display(sum_0^n)")).toContain("<munderover>");
    expect(typstToMathML("inline(sum_0^n)", { display: "block" })).toContain("<msubsup>");
    expect(typstToMathML("frac(sum_0^n, 2)", { display: "block" })).toContain("<msubsup>");
  });

  test("keeps integral scripts on the side", () => {
    const out = typstToMathML("integral_0^1", { display: "block" });
    expect(out).toContain("<msubsup>");
    expect(out).not.toContain("<munderover>");
  });
});
