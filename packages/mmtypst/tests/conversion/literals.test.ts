import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("literals conversion", () => {
  describe("identifiers", () => {
    test("renders single-letter variables as italic identifiers", () => {
      const mathml = typstToMathML("x + y");
      expect(mathml).toContain("<mi>x</mi>");
      expect(mathml).toContain("<mo>+</mo>");
      expect(mathml).toContain("<mi>y</mi>");
    });
  });

  describe("numbers", () => {
    test("renders integers and decimal numbers as mn elements", () => {
      expect(typstToMathML("42")).toContain("<mn>42</mn>");
      expect(typstToMathML("3.14159")).toContain("<mn>3.14159</mn>");
    });
  });

  describe("strings", () => {
    test("renders string literals as mtext elements", () => {
      expect(typstToMathML('"hello world"')).toContain("<mtext>hello world</mtext>");
    });
  });

  describe("spaces", () => {
    test("renders mathematical spaces as mspace with standard widths", () => {
      expect(typstToMathML("x thin y")).toContain('<mspace width="0.1667em"/>');
      expect(typstToMathML("x med y")).toContain('<mspace width="0.2222em"/>');
      expect(typstToMathML("x thick y")).toContain('<mspace width="0.2778em"/>');
      expect(typstToMathML("x quad y")).toContain('<mspace width="1em"/>');
      expect(typstToMathML("x wide y")).toContain('<mspace width="2em"/>');
    });
  });

  test("renders escaped Unicode text and literal mathematical letters", () => {
    expect(typstToMathML(String.raw`"\u{03B1}"`)).toContain("<mtext>α</mtext>");
    expect(typstToMathML("𝐀")).toContain("<mi>𝐀</mi>");
  });
});
