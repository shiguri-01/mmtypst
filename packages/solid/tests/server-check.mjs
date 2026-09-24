import assert from "node:assert/strict";
import test from "node:test";

import { Math } from "@mmtypst/solid";
import { renderToString } from "solid-js/web";

test("renders native MathML with attributes on the server", () => {
  const html = renderToString(() =>
    Math({ source: "x + 1", class: "equation", id: "example", "aria-label": "x plus one" }),
  );

  assert.match(html, /<math[^>]*class="equation\s*"/);
  assert.match(html, /id="example"/);
  assert.match(html, /aria-label="x plus one"/);
  assert.match(html, /display="inline"/);
  assert.match(html, /<mrow><mi>x<\/mi><mo>\+<\/mo><mn>1<\/mn><\/mrow>/);
});

test("uses block layout and custom symbols on the server", () => {
  const html = renderToString(() =>
    Math({ source: "sum_0^n + alpha", display: "block", symbols: { alpha: "A" } }),
  );

  assert.match(html, /display="block"/);
  assert.match(html, /<munderover>/);
  assert.match(html, /<mi>A<\/mi>/);
});

test("renders an error or throws according to throwOnError", () => {
  assert.match(
    renderToString(() => Math({ source: "1 /" })),
    /<merror>/,
  );
  assert.throws(() => renderToString(() => Math({ source: "1 /", throwOnError: true })));
});

test("escapes expression text before inserting MathML", () => {
  const html = renderToString(() => Math({ source: '"<img src=x onerror=alert(1)>"' }));

  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
});
