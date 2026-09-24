// @vitest-environment jsdom
import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, test } from "vite-plus/test";

import { Math } from "../src/index.tsx";

describe("Math browser", () => {
  test("renders a MathML element and updates when the source changes", () => {
    const [source, setSource] = createSignal("x + 1");
    let element: MathMLElement | undefined;
    const rendered = render(() => (
      <Math source={source()} aria-label="equation" ref={(node) => (element = node)} />
    ));

    const math = rendered.getByLabelText("equation");
    expect(math).toBe(element);
    expect(math.namespaceURI).toBe("http://www.w3.org/1998/Math/MathML");
    expect(math.innerHTML).toContain("<mi>x</mi>");
    setSource("y + 2");
    expect(math.innerHTML).toContain("<mi>y</mi>");
    expect(math.innerHTML).not.toContain("<mi>x</mi>");

    rendered.unmount();
  });
});
