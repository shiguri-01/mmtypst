import { describe, expect, test } from "vite-plus/test";

import { renderMathML } from "../../src/index.ts";

describe("matrices conversion", () => {
  describe("matrices", () => {
    test("renders matrix elements in mtable rows", () => {
      const mat = renderMathML("mat(1, 2; 3, 4)");
      expect(mat).toContain('<mo fence="true">(</mo>');
      expect(mat).toContain("<mtable>");
      expect(mat).toContain("<mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr>");
      expect(mat).toContain("<mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>");
      expect(mat).toContain('<mo fence="true">)</mo>');
    });

    test("supports custom delimiters", () => {
      const bracketMat = renderMathML('mat(delim: "[", 1, 2; 3, 4)');
      expect(bracketMat).toContain('<mo fence="true">[</mo>');
      expect(bracketMat).toContain('<mo fence="true">]</mo>');

      const pipeMat = renderMathML('mat(delim: "|", 1, 2; 3, 4)');
      expect(pipeMat).toContain('<mo fence="true">|</mo>');

      const doubleBracketMat = renderMathML('mat(delim: "⟦", 1, 2; 3, 4)');
      expect(doubleBracketMat).toContain('<mo fence="true">⟦</mo>');
      expect(doubleBracketMat).toContain('<mo fence="true">⟧</mo>');
    });
  });

  describe("vectors", () => {
    test("renders multi-element vector as multi-row mtable", () => {
      const multiVec = renderMathML("vec(1, 2, 3)");
      expect(multiVec).toContain("<mtr><mtd><mn>1</mn></mtd></mtr>");
      expect(multiVec).toContain("<mtr><mtd><mn>2</mn></mtd></mtr>");
      expect(multiVec).toContain("<mtr><mtd><mn>3</mn></mtd></mtr>");
    });
  });

  describe("cases", () => {
    test("renders piecewise conditions with cases class", () => {
      const casesText = renderMathML('cases(1 "if" x > 0, 0 "otherwise")');
      expect(casesText).toContain('class="cases"');
      expect(casesText).toContain("<mtext>if</mtext>");
      expect(casesText).toContain("<mtext>otherwise</mtext>");
    });

    test("aligns cases columns when ampersand separator is present", () => {
      const casesAligned = renderMathML('cases(1 & "if" x > 0, 0 & "otherwise")');
      expect(casesAligned).toContain(
        '<mtr><mtd style="text-align: right"><mn>1</mn></mtd><mtd style="text-align: left">',
      );
    });
  });

  test("renders a custom cases delimiter", () => {
    const output = renderMathML('cases(x, delim: "⟦")');
    expect(output).toContain('<mo fence="true">⟦</mo>');
    expect(output).toContain('<mtable class="cases">');
  });
});
