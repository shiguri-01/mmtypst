import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("symbols conversion", () => {
  describe("Greek letters", () => {
    test("converts lowercase Greek letters", () => {
      const result = typstToMathML("alpha + beta = gamma");
      expect(result).toContain("<mi>α</mi>");
      expect(result).toContain("<mi>β</mi>");
      expect(result).toContain("<mi>γ</mi>");
    });

    test("converts uppercase Greek letters", () => {
      const result = typstToMathML("Gamma + Delta");
      expect(result).toContain("<mi>Γ</mi>");
      expect(result).toContain("<mi>Δ</mi>");
    });

    test("converts variant Greek letters", () => {
      const result = typstToMathML("phi.alt + theta.alt + epsilon.alt");
      expect(result).toContain("<mi>ϕ</mi>");
      expect(result).toContain("<mi>ϑ</mi>");
      expect(result).toContain("<mi>ϵ</mi>");
    });
  });

  describe("sets", () => {
    test("converts blackboard bold number sets", () => {
      expect(typstToMathML("RR")).toContain("<mi>ℝ</mi>");
      expect(typstToMathML("NN")).toContain("<mi>ℕ</mi>");
      expect(typstToMathML("ZZ")).toContain("<mi>ℤ</mi>");
      expect(typstToMathML("QQ")).toContain("<mi>ℚ</mi>");
      expect(typstToMathML("CC")).toContain("<mi>ℂ</mi>");
    });
  });

  describe("arrows", () => {
    test("converts ASCII arrow shorthands to Unicode arrows", () => {
      expect(typstToMathML("a -> b")).toContain("<mo>→</mo>");
      expect(typstToMathML("a <- b")).toContain("<mo>←</mo>");
      expect(typstToMathML("a <-> b")).toContain("<mo>↔</mo>");
      expect(typstToMathML("a => b")).toContain("<mo>⇒</mo>");
      expect(typstToMathML("a <=> b")).toContain("<mo>⇔</mo>");
      expect(typstToMathML("a --> b")).toContain("<mo>⟶</mo>");
      expect(typstToMathML("a <-- b")).toContain("<mo>⟵</mo>");
      expect(typstToMathML("a <--> b")).toContain("<mo>⟷</mo>");
      expect(typstToMathML("a ==> b")).toContain("<mo>⟹</mo>");
      expect(typstToMathML("a <== b")).toContain("<mo>⟸</mo>");
      expect(typstToMathML("a <==> b")).toContain("<mo>⟺</mo>");
      expect(typstToMathML("a |-> b")).toContain("<mo>↦</mo>");
    });
  });

  describe("relations and operators", () => {
    test("converts shorthand operators", () => {
      expect(typstToMathML("a != b")).toContain("<mo>≠</mo>");
      expect(typstToMathML("a := b")).toContain("<mo>≔</mo>");
      expect(typstToMathML("a ::= b")).toContain("<mo>⩴</mo>");
      expect(typstToMathML("a =: b")).toContain("<mo>≕</mo>");
      expect(typstToMathML("a <= b")).toContain("<mo>≤</mo>");
      expect(typstToMathML("a >= b")).toContain("<mo>≥</mo>");
      expect(typstToMathML("a << b")).toContain("<mo>≪</mo>");
      expect(typstToMathML("a >> b")).toContain("<mo>≫</mo>");
      expect(typstToMathML("a <<< b")).toContain("<mo>⋘</mo>");
      expect(typstToMathML("a >>> b")).toContain("<mo>⋙</mo>");
      expect(typstToMathML("a ... b")).toContain("<mi>…</mi>");
      expect(typstToMathML("a plus.minus b")).toContain("<mo>±</mo>");
    });

    test("preserves direct Unicode mathematical operators identically to ASCII shorthands", () => {
      expect(typstToMathML("a ≤ b")).toContain("<mo>≤</mo>");
      expect(typstToMathML("a ≥ b")).toContain("<mo>≥</mo>");
      expect(typstToMathML("a ≠ b")).toContain("<mo>≠</mo>");
      expect(typstToMathML("a × b")).toContain("<mo>×</mo>");
      expect(typstToMathML("a ÷ b")).toContain("<mo>÷</mo>");
      expect(typstToMathML("a − b")).toContain("<mo>−</mo>");
      expect(typstToMathML("a ⋅ b")).toContain("<mo>⋅</mo>");
      expect(typstToMathML("a → b")).toContain("<mo>→</mo>");
      expect(typstToMathML("a ← b")).toContain("<mo>←</mo>");
      expect(typstToMathML("a ↔ b")).toContain("<mo>↔</mo>");
      expect(typstToMathML("a ⇒ b")).toContain("<mo>⇒</mo>");
      expect(typstToMathML("a ⇔ b")).toContain("<mo>⇔</mo>");
    });

    test("handles Unicode relation operators with binary operator precedence", () => {
      expect(typstToMathML("x ≈ y")).toContain("<mrow><mi>x</mi><mo>≈</mo><mi>y</mi></mrow>");
      expect(typstToMathML("x ∈ A")).toContain("<mrow><mi>x</mi><mo>∈</mo><mi>A</mi></mrow>");
      expect(typstToMathML("A ⊂ B")).toContain("<mrow><mi>A</mi><mo>⊂</mo><mi>B</mi></mrow>");
      expect(typstToMathML("a ∥ b")).toContain("<mrow><mi>a</mi><mo>∥</mo><mi>b</mi></mrow>");
      expect(typstToMathML("a ⟂ b")).toContain("<mrow><mi>a</mi><mo>⟂</mo><mi>b</mi></mrow>");
    });
  });

  describe("miscellaneous symbols", () => {
    test("converts mathematical constants and logic entities", () => {
      expect(typstToMathML("infinity")).toContain("<mi>∞</mi>");
      expect(typstToMathML("oo")).toContain("<mi>∞</mi>");
      expect(typstToMathML("planck")).toContain("<mi>ħ</mi>");
      expect(typstToMathML("nothing")).toContain("<mi>∅</mi>");
      expect(typstToMathML("emptyset")).toContain("<mi>∅</mi>");
      expect(typstToMathML("nabla")).toContain("<mo>∇</mo>");
      expect(typstToMathML("partial")).toContain("<mi>∂</mi>");
      expect(typstToMathML("forall")).toContain("<mo>∀</mo>");
      expect(typstToMathML("exists")).toContain("<mo>∃</mo>");
    });

    test("converts differential operators dif and Dif", () => {
      const integral = typstToMathML("integral e^x dif x");
      expect(integral).toContain("<mo>∫</mo>");
      expect(integral).toContain("<mo>d</mo>");
    });
  });
});
