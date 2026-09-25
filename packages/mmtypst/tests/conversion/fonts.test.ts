import { describe, expect, test } from "vite-plus/test";

import { renderMathML } from "../../src/index.ts";

describe("fonts conversion", () => {
  test("maps font styling functions to MathML Core characters", () => {
    expect(renderMathML("bold(x)")).toContain("𝐱");
    expect(renderMathML("italic(x)")).toContain("𝑥");
    expect(renderMathML("upright(A)")).toContain('<mi mathvariant="normal">A</mi>');
    expect(renderMathML("bb(R)")).toContain("ℝ");
    expect(renderMathML("cal(F)")).toContain("ℱ");
    expect(renderMathML("frak(g)")).toContain("𝔤");
    expect(renderMathML("sans(M)")).toContain("𝖬");
    expect(renderMathML("mono(T)")).toContain("𝚃");
  });

  test("uses Core font characters for Greek, digits and legacy exceptions", () => {
    expect(renderMathML("bold(alpha)")).toContain("𝛂");
    expect(renderMathML("italic(h)")).toContain("ℎ");
    expect(renderMathML("bold(12)")).toContain("𝟏𝟐");
  });

  test.each([
    ["bold(upright(A))", "𝐀"],
    ["sans(cal(A))", "𝒜"],
    ["cal(sans(A))", "𝖠"],
    ["sans(bb(A))", "𝔸"],
  ])("renders the composed style in %s", (input, expected) => {
    expect(renderMathML(input)).toBe(
      `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mi mathvariant="normal">${expected}</mi></math>`,
    );
  });

  test("uses mathematical alphanumeric characters for nested fonts", () => {
    const out = renderMathML("bold(italic(x + 2))");
    expect(out).toContain("𝒙");
    expect(out).toContain("𝟐");
  });
});
