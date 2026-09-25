import { describe, expect, test } from "vite-plus/test";

import { extractTypstMath, renderMathML, renderMathMLBody } from "../../src/index.ts";

describe("options conversion", () => {
  describe("extractTypstMath", () => {
    test("extracts inline math", () => {
      expect(extractTypstMath(" $x + y$ ")).toEqual({ body: "x + y", display: "inline" });
    });

    test("extracts block math from delimiter-adjacent whitespace", () => {
      expect(extractTypstMath("\n  $ x + y $\n")).toEqual({ body: "x + y", display: "block" });
    });

    test("requires dollar delimiters", () => {
      expect(() => extractTypstMath("x + y")).toThrow(RangeError);
    });
  });

  describe("display", () => {
    test("allows overriding display mode explicitly", () => {
      expect(renderMathML("x + y = z", { display: "block" })).toContain('display="block"');
    });
  });

  test("wraps output in root math element", () => {
    expect(renderMathML("x + 1")).toBe(
      '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></math>',
    );
  });

  describe("MathML body", () => {
    test("returns the same content as the complete math element", () => {
      expect(renderMathMLBody("x + 1")).toBe("<mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow>");
      expect(renderMathML("x + 1")).toContain(`>${renderMathMLBody("x + 1")}</math>`);
    });

    test("uses display mode when placing limits", () => {
      expect(renderMathMLBody("sum_0^n")).toContain("<msubsup>");
      expect(renderMathMLBody("sum_0^n", { display: "block" })).toContain("<munderover>");
    });

    test("supports custom symbols and the same error behavior", () => {
      expect(renderMathMLBody("alpha", { symbols: { alpha: "A" } })).toBe("<mi>A</mi>");
      expect(renderMathMLBody("1 /")).toContain("<merror><mtext>");
      expect(() => renderMathMLBody("1 /", { throwOnError: true })).toThrow();
    });
  });

  describe("error handling", () => {
    test("renders error messages as CSS-stylable text inside math", () => {
      const output = renderMathML("1 /", { throwOnError: false });
      expect(output).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML"');
      expect(output).toContain("<merror><mtext>");
      expect(output).toContain("Expected denominator after /");
      expect(output).toContain("</math>");
      expect(output).not.toContain("style=");
    });
  });

  describe("attributes and class", () => {
    test("attaches custom class and attributes to root math element", () => {
      const withAttrs = renderMathML("x", {
        class: "formula-inline",
        attributes: { id: "eq-1" },
      });
      expect(withAttrs).toContain('class="formula-inline"');
      expect(withAttrs).toContain('id="eq-1"');
    });
  });

  test.each(["frac(1)", "sqrt(x, y)", "foo(x, ignored: y)"])(
    "reports malformed or unsupported input: %s",
    (source) => {
      expect(renderMathML(source)).toContain("<merror>");
      expect(() => renderMathML(source, { throwOnError: true })).toThrow();
    },
  );

  test("custom symbols override original built-in names and preserve categories", () => {
    const output = renderMathML("alpha times beta", {
      symbols: { alpha: "A", times: "××" },
    });
    expect(output).toContain("<mi>A</mi>");
    expect(output).toContain("<mo>××</mo>");
  });

  test("error output includes display, class and attributes on the math element", () => {
    const source = "1 /";
    const output = renderMathML(source, {
      display: "block",
      class: "equation",
      attributes: { id: "eq-1" },
    });
    expect(output).toContain("<merror>");
    expect(output).toContain('display="block"');
    expect(output).toContain('class="equation"');
    expect(output).toContain('id="eq-1"');
    expect(output).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML"');
    expect(output).toContain("</math>");
    expect(() => renderMathML(source, { throwOnError: true })).toThrow();
  });
});
