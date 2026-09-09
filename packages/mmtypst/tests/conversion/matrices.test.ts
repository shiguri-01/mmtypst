import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("matrices conversion", () => {
  describe("matrices", () => {
    test("renders matrix elements in mtable rows", () => {
      const mat = typstToMathML("mat(1, 2; 3, 4)");
      expect(mat).toContain('<mo fence="true">(</mo>');
      expect(mat).toContain("<mtable>");
      expect(mat).toContain("<mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr>");
      expect(mat).toContain("<mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>");
      expect(mat).toContain('<mo fence="true">)</mo>');
    });

    test("supports custom delimiters", () => {
      const bracketMat = typstToMathML('mat(delim: "[", 1, 2; 3, 4)');
      expect(bracketMat).toContain('<mo fence="true">[</mo>');
      expect(bracketMat).toContain('<mo fence="true">]</mo>');

      const pipeMat = typstToMathML('mat(delim: "|", 1, 2; 3, 4)');
      expect(pipeMat).toContain('<mo fence="true">|</mo>');

      const noneMat = typstToMathML('mat(delim: "none", 1, 2; 3, 4)');
      expect(noneMat).not.toContain('<mo fence="true">');
      expect(noneMat).toContain("<mtable>");
    });
  });

  describe("vectors", () => {
    test("renders single-element vector as single-row mtable", () => {
      const singleVec = typstToMathML("vec(x)");
      expect(singleVec).toContain("<mtable>");
      expect(singleVec).toContain("<mtr><mtd><mi>x</mi></mtd></mtr>");
      expect(singleVec).not.toContain("<mi>vec</mi>");
    });

    test("renders multi-element vector as multi-row mtable", () => {
      const multiVec = typstToMathML("vec(1, 2, 3)");
      expect(multiVec).toContain("<mtr><mtd><mn>1</mn></mtd></mtr>");
      expect(multiVec).toContain("<mtr><mtd><mn>2</mn></mtd></mtr>");
      expect(multiVec).toContain("<mtr><mtd><mn>3</mn></mtd></mtr>");
    });
  });

  describe("cases", () => {
    test("renders piecewise conditions with cases class", () => {
      const casesText = typstToMathML('cases(1 "if" x > 0, 0 "otherwise")');
      expect(casesText).toContain('class="cases"');
      expect(casesText).toContain("<mtext>if</mtext>");
      expect(casesText).toContain("<mtext>otherwise</mtext>");
    });

    test("aligns cases columns when ampersand separator is present", () => {
      const casesAligned = typstToMathML('cases(1 & "if" x > 0, 0 & "otherwise")');
      expect(casesAligned).toContain(
        '<mtr><mtd style="text-align: right"><mn>1</mn></mtd><mtd style="text-align: left">',
      );
    });
  });

  test.each([
    ["[|", "⟦"],
    ["||", "‖"],
    ["{", "{"],
    ["none", ""],
  ])("uses shared delimiter spellings in cases: %s", (delimiter, expected) => {
    const output = typstToMathML(`cases(x, delim: "${delimiter}")`);
    const fence = expected ? `<mo fence="true">${expected}</mo>` : "";
    expect(output).toBe(
      `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mrow>${fence}<mtable class="cases"><mtr><mtd><mi>x</mi></mtd></mtr></mtable></mrow></math>`,
    );
  });
});
