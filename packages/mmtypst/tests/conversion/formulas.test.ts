import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("formulas conversion", () => {
  test("quadratic formula", () => {
    const mathml = typstToMathML("x = (-b plus.minus sqrt(b^2 - 4 * a * c)) / (2 * a)");
    expect(mathml).toContain("<mo>±</mo>");
    expect(mathml).toContain("<msqrt>");
    expect(mathml).toContain("<mfrac>");
  });

  test("Euler identity", () => {
    const mathml = typstToMathML("e^(i * pi) + 1 = 0");
    expect(mathml).toContain("<msup><mi>e</mi>");
    expect(mathml).toContain("<mi>π</mi>");
    expect(mathml).toContain("<mo>=</mo>");
    expect(mathml).toContain("<mn>0</mn>");
  });

  test("Gaussian integral", () => {
    const mathml = typstToMathML("integral_(-oo)^oo e^(-x^2) dif x = sqrt(pi)");
    expect(mathml).toContain("<mo>∫</mo>");
    expect(mathml).toContain("<mo>−</mo><mi>∞</mi>");
    expect(mathml).toContain("<mi>∞</mi>");
    expect(mathml).toContain("<mo>d</mo>");
    expect(mathml).toContain("<msqrt><mi>π</mi></msqrt>");
  });
});
