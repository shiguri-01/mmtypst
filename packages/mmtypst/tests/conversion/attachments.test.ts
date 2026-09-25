import { describe, expect, test } from "vite-plus/test";

import { renderMathML } from "../../src/index.ts";

describe("attachments conversion", () => {
  describe("subscripts and superscripts", () => {
    test("attaches subscript with underscore", () => {
      expect(renderMathML("x_1")).toContain("<msub><mi>x</mi><mn>1</mn></msub>");
    });

    test("attaches superscript with caret", () => {
      expect(renderMathML("x^2")).toContain("<msup><mi>x</mi><mn>2</mn></msup>");
    });

    test("attaches both subscript and superscript using msubsup", () => {
      expect(renderMathML("x_1^2")).toContain("<msubsup><mi>x</mi><mn>1</mn><mn>2</mn></msubsup>");
    });
  });

  describe("large operators and limits", () => {
    test("keeps primes on the side of an operator with limits", () => {
      expect(renderMathML("sum'_i^n", { display: "block" })).toContain(
        '<munderover><msup><mo movablelimits="false">∑</mo><mo>′</mo></msup><mi>i</mi><mi>n</mi></munderover>',
      );
    });

    test("renders limits above and below with munderover in block display mode", () => {
      const blockSum = renderMathML("sum_(i=1)^n i", { display: "block" });
      expect(blockSum).toContain("<munderover>");
      expect(blockSum).toContain('<mo movablelimits="false">∑</mo>');
    });

    test("renders limits as scripts with msubsup in inline display mode", () => {
      const inlineSum = renderMathML("sum_(i=1)^n i", { display: "inline" });
      expect(inlineSum).toContain("<msubsup>");
      expect(inlineSum).toContain("<mo>∑</mo>");
    });

    test("forces side scripts without changing display size", () => {
      const output = renderMathML("scripts(sum)_0^n", { display: "block" });
      expect(output).toContain("<msubsup>");
      expect(output).not.toContain("displaystyle=");
    });
  });

  describe("attach function", () => {
    test("renders multi-scripts with MathML Core empty slot mrow placeholder", () => {
      const multi = renderMathML("attach(A, t: 1, bl: 2)");
      expect(multi).toContain("<mmultiscripts>");
      expect(multi).toContain("<mprescripts/>");
      expect(multi).toContain("<mrow/>");
      expect(multi).not.toContain("<none/>");
    });
  });

  test("retains all six attachment arguments", () => {
    const output = renderMathML("attach(limits(A), t:1, tr:2, b:3, br:4, tl:5, bl:6)");
    expect(output).toBe(
      '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mmultiscripts><munderover><mi>A</mi><mn>3</mn><mn>1</mn></munderover><mn>4</mn><mn>2</mn><mprescripts/><mn>6</mn><mn>5</mn></mmultiscripts></math>',
    );
  });

  test("display context and explicit placement are independent", () => {
    const forced = renderMathML("limits(sum)_0^n");
    expect(forced).toContain('<munderover><mo movablelimits="false">∑</mo>');
    expect(forced).not.toContain("displaystyle=");
    expect(renderMathML("display(sum_0^n)")).toContain("<munderover>");
    expect(renderMathML("inline(sum_0^n)", { display: "block" })).toContain("<msubsup>");
    expect(renderMathML("frac(sum_0^n, 2)", { display: "block" })).toContain("<msubsup>");
  });

  test("keeps integral scripts on the side", () => {
    const out = renderMathML("integral_0^1", { display: "block" });
    expect(out).toContain("<msubsup>");
    expect(out).not.toContain("<munderover>");
  });
});
