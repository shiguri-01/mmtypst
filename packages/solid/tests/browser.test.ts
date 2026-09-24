// @vitest-environment jsdom
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { describe, expect, test } from "vite-plus/test";

import { Math } from "../dist/browser/index.mjs";

describe("Math browser", () => {
  test("renders a MathML element and updates when the source changes", () => {
    const container = document.createElement("div");
    const [source, setSource] = createSignal("x + 1");
    let element: MathMLElement | undefined;

    const dispose = render(
      () =>
        Math({
          get source() {
            return source();
          },
          ref: (node) => {
            element = node;
          },
        }),
      container,
    );

    expect(element?.namespaceURI).toBe("http://www.w3.org/1998/Math/MathML");
    expect(container.innerHTML).toContain("<mi>x</mi>");
    setSource("y + 2");
    expect(container.innerHTML).toContain("<mi>y</mi>");
    expect(container.innerHTML).not.toContain("<mi>x</mi>");

    dispose();
  });
});
