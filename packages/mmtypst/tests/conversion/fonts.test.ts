import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("fonts conversion", () => {
  test("maps font styling functions to MathML Core characters", () => {
    expect(typstToMathML("bold(x)")).toContain("𝐱");
    expect(typstToMathML("italic(x)")).toContain("𝑥");
    expect(typstToMathML("upright(A)")).toContain('<mi mathvariant="normal">A</mi>');
    expect(typstToMathML("bb(R)")).toContain("ℝ");
    expect(typstToMathML("cal(F)")).toContain("ℱ");
    expect(typstToMathML("frak(g)")).toContain("𝔤");
    expect(typstToMathML("sans(M)")).toContain("𝖬");
    expect(typstToMathML("mono(T)")).toContain("𝚃");
  });

  test("uses Core font characters for Greek, digits and legacy exceptions", () => {
    expect(typstToMathML("bold(alpha)")).toContain("𝛂");
    expect(typstToMathML("italic(h)")).toContain("ℎ");
    expect(typstToMathML("bold(12)")).toContain("𝟏𝟐");
  });

  test.each([
    ["bold(upright(A))", "𝐀"],
    ["sans(cal(A))", "𝒜"],
    ["cal(sans(A))", "𝖠"],
    ["sans(bb(A))", "𝔸"],
  ])("renders the composed style in %s", (input, expected) => {
    expect(typstToMathML(input)).toBe(
      `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mi mathvariant="normal">${expected}</mi></math>`,
    );
  });

  test("uses mathematical alphanumeric characters for nested fonts", () => {
    const out = typstToMathML("bold(italic(x + 2))");
    expect(out).toContain("𝒙");
    expect(out).toContain("𝟐");
  });
});
