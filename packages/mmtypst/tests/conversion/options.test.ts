import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("options conversion", () => {
  describe("display", () => {
    test("defaults single-line expressions to inline", () => {
      expect(typstToMathML("x + y = z")).toContain('display="inline"');
    });

    test("defaults multiline expressions to inline", () => {
      expect(typstToMathML("f(x) &= 1 \\ &= 2")).toContain('display="inline"');
    });

    test("allows overriding display mode explicitly", () => {
      expect(typstToMathML("x + y = z", { display: "block" })).toContain('display="block"');
      expect(typstToMathML("f(x) &= 1 \\ &= 2", { display: "block" })).toContain('display="block"');
      expect(typstToMathML("f(x) &= 1 \\ &= 2", { display: "inline" })).toContain(
        'display="inline"',
      );
    });
  });

  test("wraps output in root math element", () => {
    expect(typstToMathML("x + 1")).toBe(
      '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></math>',
    );
  });

  describe("error handling", () => {
    test("renders error messages as CSS-stylable text inside math", () => {
      const output = typstToMathML("1 /", { throwOnError: false });
      expect(output).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML"');
      expect(output).toContain("<merror><mtext>");
      expect(output).toContain("Expected denominator after /");
      expect(output).toContain("</math>");
      expect(output).not.toContain("style=");
    });
  });

  describe("attributes and class", () => {
    test("attaches custom class and attributes to root math element", () => {
      const withAttrs = typstToMathML("x", {
        class: "formula-inline",
        attributes: { id: "eq-1", "data-formula": "x" },
      });
      expect(withAttrs).toContain('class="formula-inline"');
      expect(withAttrs).toContain('id="eq-1"');
      expect(withAttrs).toContain('data-formula="x"');
    });
  });

  describe("custom symbols", () => {
    test("registers custom symbol mappings", () => {
      const custom = typstToMathML("customStar + 1", {
        symbols: { customStar: "★" },
      });
      expect(custom).toContain("<mi>★</mi>");
    });
  });

  test.each([
    "mat(foo: 1, 2)",
    'vec(delim: "[", delim: "(", 1)',
    "attach(x, t: 2, t: 3)",
    "frac(1)",
    "sqrt(x, y)",
    "sqrt(index: 3, x)",
    "foo(x, ignored: y)",
  ])("reports malformed or unsupported input: %s", (source) => {
    expect(typstToMathML(source)).toContain("<merror>");
    expect(() => typstToMathML(source, { throwOnError: true })).toThrow();
  });

  test("custom symbols override original built-in names and preserve categories", () => {
    const output = typstToMathML("alpha times beta", {
      symbols: { alpha: "A", times: "××" },
    });
    expect(output).toContain("<mi>A</mi>");
    expect(output).toContain("<mo>××</mo>");
  });

  test.each(['"unterminated', "1 /", "sqrt()"])(
    "error output includes display, class and attributes on the math element: %s",
    (source) => {
      const output = typstToMathML(source, {
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
      expect(() => typstToMathML(source, { throwOnError: true })).toThrow();
    },
  );
});
