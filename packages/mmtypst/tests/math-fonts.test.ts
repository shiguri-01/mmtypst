import { describe, expect, test } from "vite-plus/test";

import { combineFontVariant } from "../src/math-fonts.ts";

describe("font style composition", () => {
  test.each([
    ["bold", "italic", "bold-italic"],
    ["sans-serif", "bold", "sans-serif-bold"],
    ["fraktur", "bold", "bold-fraktur"],
  ])("combines independent style properties: %s + %s", (outer, inner, expected) => {
    expect(combineFontVariant(outer, inner)).toBe(expected);
  });

  test.each([["bold-italic", "bold"]])(
    "upright removes only italics from %s",
    (outer, expected) => {
      expect(combineFontVariant(outer, "normal")).toBe(expected);
    },
  );

  test.each([["script", "sans-serif", "sans-serif"]])(
    "uses the innermost family: %s + %s",
    (outer, inner, expected) => {
      expect(combineFontVariant(outer, inner)).toBe(expected);
    },
  );

  test.each([
    ["monospace", "bold", "monospace"],
    ["double-struck", "italic", "double-struck"],
  ])("keeps the family when Unicode lacks the style: %s + %s", (outer, inner, expected) => {
    expect(combineFontVariant(outer, inner)).toBe(expected);
  });
});
