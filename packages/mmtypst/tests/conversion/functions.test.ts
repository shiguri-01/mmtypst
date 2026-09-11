import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("functions conversion", () => {
  describe("roots", () => {
    test("renders square root with sqrt function", () => {
      expect(typstToMathML("sqrt(x)")).toContain("<msqrt><mi>x</mi></msqrt>");
    });

    test("renders square root with root function when degree is omitted", () => {
      expect(typstToMathML("root(x)")).toContain("<msqrt><mi>x</mi></msqrt>");
    });

    test("renders n-th root with positional degree argument", () => {
      expect(typstToMathML("root(3, x)")).toContain("<mroot><mi>x</mi><mn>3</mn></mroot>");
    });

    test("renders n-th root with named degree arguments n and index", () => {
      expect(typstToMathML("root(n: 3, x)")).toContain("<mroot><mi>x</mi><mn>3</mn></mroot>");
      expect(typstToMathML("root(index: 4, y)")).toContain("<mroot><mi>y</mi><mn>4</mn></mroot>");
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
      expect(typstToMathML("cos x")).toContain('<mi mathvariant="normal">cos</mi>');
      expect(typstToMathML("ln x")).toContain('<mi mathvariant="normal">ln</mi>');
    });

    test("renders functions in upright font in call position", () => {
      expect(typstToMathML("sin(x)")).toContain('<mi mathvariant="normal">sin</mi>');
      expect(typstToMathML("cos(x + y)")).toContain('<mi mathvariant="normal">cos</mi>');
      expect(typstToMathML("arctan(1)")).toContain('<mi mathvariant="normal">arctan</mi>');
      expect(typstToMathML("log(10)")).toContain('<mi mathvariant="normal">log</mi>');
    });
  });

  describe("fences and delimiters", () => {
    test("renders absolute value with vertical bars", () => {
      expect(typstToMathML("abs(x)")).toContain(
        '<mrow><mo fence="true">|</mo><mi>x</mi><mo fence="true">|</mo></mrow>',
      );
    });

    test("renders norm with double vertical bars", () => {
      expect(typstToMathML("norm(v)")).toContain(
        '<mrow><mo fence="true">‖</mo><mi>v</mi><mo fence="true">‖</mo></mrow>',
      );
    });

    test("renders floor delimiters", () => {
      expect(typstToMathML("floor(x)")).toContain(
        '<mrow><mo fence="true">⌊</mo><mi>x</mi><mo fence="true">⌋</mo></mrow>',
      );
    });

    test("renders ceil delimiters", () => {
      expect(typstToMathML("ceil(x)")).toContain(
        '<mrow><mo fence="true">⌈</mo><mi>x</mi><mo fence="true">⌉</mo></mrow>',
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
      expect(typstToMathML("⟦a + b⟧")).toContain(
        '<mrow><mo fence="true">⟦</mo><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo fence="true">⟧</mo></mrow>',
      );
    });

    test("renders shorthand double brackets [| and |] as fenced group", () => {
      expect(typstToMathML("[|x|]")).toContain(
        '<mrow><mo fence="true">⟦</mo><mi>x</mi><mo fence="true">⟧</mo></mrow>',
      );
      expect(typstToMathML("[|a + b|]")).toContain(
        '<mrow><mo fence="true">⟦</mo><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo fence="true">⟧</mo></mrow>',
      );
    });

    test("renders bracket.l.stroked and bracket.r.stroked as fence operators", () => {
      const mathml = typstToMathML("bracket.l.stroked x bracket.r.stroked");
      expect(mathml).toContain('<mo fence="true">⟦</mo>');
      expect(mathml).toContain('<mo fence="true">⟧</mo>');
    });

    test("preserves double brackets in division and attachments", () => {
      expect(typstToMathML("⟦a + b⟧ / 2")).toContain(
        '<mfrac><mrow><mrow><mo fence="true">⟦</mo><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo fence="true">⟧</mo></mrow></mrow><mrow><mn>2</mn></mrow></mfrac>',
      );
      expect(typstToMathML("x_⟦1⟧")).toContain(
        '<msub><mi>x</mi><mrow><mo fence="true">⟦</mo><mn>1</mn><mo fence="true">⟧</mo></mrow></msub>',
      );
    });

    test("supports double brackets in matrices", () => {
      const mat = typstToMathML('mat(delim: "⟦", 1, 2; 3, 4)');
      expect(mat).toContain('<mo fence="true">⟦</mo>');
      expect(mat).toContain('<mo fence="true">⟧</mo>');

      const matShorthand = typstToMathML('mat(delim: "[|", 1, 2; 3, 4)');
      expect(matShorthand).toContain('<mo fence="true">⟦</mo>');
      expect(matShorthand).toContain('<mo fence="true">⟧</mo>');
    });

    test("renders angle brackets, floor and ceiling as fenced groups", () => {
      expect(typstToMathML("⟨x⟩")).toContain(
        '<mrow><mo fence="true">⟨</mo><mi>x</mi><mo fence="true">⟩</mo></mrow>',
      );
      expect(typstToMathML("⌊x⌋")).toContain(
        '<mrow><mo fence="true">⌊</mo><mi>x</mi><mo fence="true">⌋</mo></mrow>',
      );
      expect(typstToMathML("⌈x⌉")).toContain(
        '<mrow><mo fence="true">⌈</mo><mi>x</mi><mo fence="true">⌉</mo></mrow>',
      );
      expect(typstToMathML("⟦⌊x⌋⟧")).toContain(
        '<mrow><mo fence="true">⟦</mo><mrow><mo fence="true">⌊</mo><mi>x</mi><mo fence="true">⌋</mo></mrow><mo fence="true">⟧</mo></mrow>',
      );
    });
  });

  describe("binomial coefficients", () => {
    test("renders binom using linethickness=0 fraction with parentheses", () => {
      const binom = typstToMathML("binom(n, k)");
      expect(binom).toContain('linethickness="0"');
      expect(binom).toContain("<mi>n</mi>");
      expect(binom).toContain("<mi>k</mi>");
      expect(binom).toContain("<mo>(</mo>");
      expect(binom).toContain("<mo>)</mo>");
    });
  });

  describe("accents and decorations", () => {
    test("renders over-accents with mover accent=true", () => {
      expect(typstToMathML("hat(x)")).toContain(
        '<mover accent="true"><mi>x</mi><mo>^</mo></mover>',
      );
      expect(typstToMathML("tilde(x)")).toContain(
        '<mover accent="true"><mi>x</mi><mo>~</mo></mover>',
      );
      expect(typstToMathML("macron(x)")).toContain(
        '<mover accent="true"><mi>x</mi><mo>¯</mo></mover>',
      );
      expect(typstToMathML("dot(x)")).toContain(
        '<mover accent="true"><mi>x</mi><mo>˙</mo></mover>',
      );
      expect(typstToMathML("arrow(v)")).toContain(
        '<mover accent="true"><mi>v</mi><mo>→</mo></mover>',
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
      '<mfrac linethickness="0"><mrow><mi>n</mi></mrow><mrow><mi>k</mi><mo>,</mo><mi>j</mi></mrow></mfrac>',
    );
  });
});
