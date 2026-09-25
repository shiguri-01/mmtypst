import { describe, expect, test } from "vite-plus/test";

import { renderMathML } from "../../src/index.ts";

describe("literals conversion", () => {
  describe("identifiers", () => {
    test("renders single-letter variables as italic identifiers", () => {
      const mathml = renderMathML("x + y");
      expect(mathml).toContain("<mi>x</mi>");
      expect(mathml).toContain("<mo>+</mo>");
      expect(mathml).toContain("<mi>y</mi>");
    });
  });

  describe("numbers", () => {
    test("renders integers and decimal numbers as mn elements", () => {
      expect(renderMathML("42")).toContain("<mn>42</mn>");
      expect(renderMathML("3.14159")).toContain("<mn>3.14159</mn>");
    });
  });

  describe("strings", () => {
    test("renders string literals as mtext elements", () => {
      expect(renderMathML('"hello world"')).toContain("<mtext>hello world</mtext>");
    });
  });

  describe("spaces", () => {
    test("renders mathematical spaces as mspace with standard widths", () => {
      expect(renderMathML("x thin y")).toContain('<mspace width="0.1667em"/>');
    });
  });

  test("renders escaped Unicode text and literal mathematical letters", () => {
    expect(renderMathML(String.raw`"\u{03B1}"`)).toContain("<mtext>α</mtext>");
    expect(renderMathML("𝐀")).toContain("<mi>𝐀</mi>");
  });
});
