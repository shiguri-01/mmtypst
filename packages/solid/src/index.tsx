import { renderMathMLBody } from "mmtypst";
import type { RenderMathMLBodyOptions } from "mmtypst";
import { createMemo, splitProps } from "solid-js";
import type { JSX } from "solid-js";

export interface MathProps
  extends
    Omit<
      JSX.IntrinsicElements["math"],
      "children" | "innerHTML" | "innerText" | "textContent" | "display"
    >,
    RenderMathMLBodyOptions {
  /** Typst math expression without its surrounding `$` delimiters. */
  source: string;
}

/** Renders a Typst math expression as a native MathML element. */
export function Math(props: MathProps): JSX.Element {
  const [options, mathProps] = splitProps(props, ["source", "display", "throwOnError", "symbols"]);
  const body = createMemo(() =>
    renderMathMLBody(options.source, {
      display: options.display,
      throwOnError: options.throwOnError,
      symbols: options.symbols,
    }),
  );

  return (
    <math
      {...mathProps}
      xmlns="http://www.w3.org/1998/Math/MathML"
      display={options.display ?? "inline"}
      innerHTML={body()}
    />
  );
}
