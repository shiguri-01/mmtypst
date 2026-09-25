import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";

import { Math } from "../src/index.ts";

describe("Math", () => {
  test("renders native MathML with forwarded attributes", () => {
    const html = renderToStaticMarkup(
      createElement(Math, {
        source: "x + 1",
        className: "equation",
        id: "example",
        "aria-label": "x plus one",
      }),
    );

    expect(html).toContain('<math class="equation" id="example" aria-label="x plus one"');
    expect(html).toContain('display="inline"');
    expect(html).toContain("<mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow>");
    expect(html).toContain("</math>");
  });

  test("uses block layout and custom symbols", () => {
    const html = renderToStaticMarkup(
      createElement(Math, {
        source: "sum_0^n + alpha",
        display: "block",
        symbols: { alpha: "A" },
      }),
    );

    expect(html).toContain('display="block"');
    expect(html).toContain("<munderover>");
    expect(html).toContain("<mi>A</mi>");
  });

  test("renders a MathML error or throws according to throwOnError", () => {
    expect(renderToStaticMarkup(createElement(Math, { source: "1 /" }))).toContain("<merror>");
    expect(() =>
      renderToStaticMarkup(createElement(Math, { source: "1 /", throwOnError: true })),
    ).toThrow();
  });

  test("escapes expression text before inserting MathML", () => {
    const html = renderToStaticMarkup(
      createElement(Math, { source: '"<img src=x onerror=alert(1)>"' }),
    );

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img");
  });
});
