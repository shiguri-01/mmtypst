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
    test("generates merror element when throwOnError is false", () => {
      const errorOutput = typstToMathML("1 /", { throwOnError: false });
      expect(errorOutput).toContain("<merror>");
      expect(errorOutput).toContain("Expected denominator after /");
    });

    test("renders error messages as CSS-stylable text inside math", () => {
      const output = typstToMathML("1 /", { throwOnError: false });
      expect(output).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML"');
      expect(output).toContain("<merror><mtext>");
      expect(output).toContain("</math>");
      expect(output).not.toContain("style=");
    });

    test("throws exception when throwOnError is true", () => {
      expect(() => {
        typstToMathML("1 /", { throwOnError: true });
      }).toThrow("Expected denominator after /");
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

  describe("unknownNames", () => {
    test.each(["foo", "foo(x)"])(
      "renders unknown names with the default and render policies: %s",
      (source) => {
        expect(typstToMathML(source)).toContain("<mi>foo</mi>");
        expect(typstToMathML(source, { unknownNames: "render", throwOnError: true })).toBe(
          typstToMathML(source),
        );
      },
    );

    test("allows unknown multi-character identifiers by default", () => {
      expect(typstToMathML("foo + 1")).toContain("<mi>foo</mi>");
    });

    test("rejects unknown multi-character identifiers with merror", () => {
      expect(typstToMathML("foo + 1", { unknownNames: "error" })).toContain("<merror>");
    });

    test("throws on unknown multi-character identifiers when throwOnError is true", () => {
      expect(() => {
        typstToMathML("foo + 1", { unknownNames: "error", throwOnError: true });
      }).toThrow('Unknown symbol: "foo"');
    });

    test("allows single-character variables when unknownNames is error", () => {
      expect(typstToMathML("x + y_1", { unknownNames: "error" })).toContain("<mi>x</mi>");
    });

    test("allows standard Typst symbols and functions when unknownNames is error", () => {
      const output = typstToMathML("alpha + beta + sin x", { unknownNames: "error" });
      expect(output).toContain("<mi>α</mi>");
      expect(output).toContain('<mi mathvariant="normal">sin</mi>');
    });

    test("allows custom registered symbols when unknownNames is error", () => {
      expect(
        typstToMathML("customVar + 1", {
          unknownNames: "error",
          symbols: { customVar: "C" },
        }),
      ).toContain("<mi>C</mi>");
    });
  });

  test.each([
    "sqrt(x",
    "mat(1",
    "vec(1",
    "cases(1",
    "mat(foo: 1, 2)",
    'vec(delim: "[", delim: "(", 1)',
    "root(n: 2, n: 3, x)",
    "frac(1)",
    "sqrt(x, y)",
    "sqrt(index: 3, x)",
    "root(3, x, index: 4)",
    "foo(x, ignored: y)",
  ])("reports malformed or unsupported input: %s", (source) => {
    expect(typstToMathML(source)).toContain("<merror>");
    expect(() => typstToMathML(source, { throwOnError: true })).toThrow();
  });

  test("custom symbols override original built-in names and preserve categories", () => {
    const output = typstToMathML("alpha times beta", {
      symbols: { alpha: "A", times: "××" },
      unknownNames: "error",
    });
    expect(output).toContain("<mi>A</mi>");
    expect(output).toContain("<mo>××</mo>");
    expect(typstToMathML("foo(x)", { unknownNames: "error" })).toContain("<merror>");
    expect(typstToMathML("sin x + gcd(a,b)", { unknownNames: "error" })).not.toContain("<merror>");
  });

  test.each(['"unterminated', "sqrt(x", "x^", "1 /"])(
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
