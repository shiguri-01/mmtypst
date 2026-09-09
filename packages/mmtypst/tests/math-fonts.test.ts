import { describe, expect, test } from "vite-plus/test";

import { combineFontVariant } from "../src/math-fonts.ts";

describe("font style composition", () => {
  test.each([
    ["bold", "italic", "bold-italic"],
    ["italic", "bold", "bold-italic"],
    ["sans-serif", "bold", "sans-serif-bold"],
    ["bold", "sans-serif", "sans-serif-bold"],
    ["sans-serif-bold", "italic", "sans-serif-bold-italic"],
    ["script", "bold", "bold-script"],
    ["fraktur", "bold", "bold-fraktur"],
  ])("combines independent style properties: %s + %s", (outer, inner, expected) => {
    expect(combineFontVariant(outer, inner)).toBe(expected);
  });

  test.each([
    ["bold-italic", "bold"],
    ["sans-serif-bold-italic", "sans-serif-bold"],
    ["script", "script"],
    ["italic", "normal"],
  ])("upright removes only italics from %s", (outer, expected) => {
    expect(combineFontVariant(outer, "normal")).toBe(expected);
  });

  test.each([
    ["sans-serif", "script", "script"],
    ["script", "sans-serif", "sans-serif"],
    ["bold-script", "fraktur", "bold-fraktur"],
    ["bold-fraktur", "script", "bold-script"],
    ["sans-serif", "monospace", "monospace"],
    ["sans-serif", "double-struck", "double-struck"],
  ])("uses the innermost family: %s + %s", (outer, inner, expected) => {
    expect(combineFontVariant(outer, inner)).toBe(expected);
  });

  test.each([
    ["script", "italic", "script"],
    ["monospace", "bold", "monospace"],
    ["double-struck", "italic", "double-struck"],
  ])("keeps the family when Unicode lacks the style: %s + %s", (outer, inner, expected) => {
    expect(combineFontVariant(outer, inner)).toBe(expected);
  });
});
