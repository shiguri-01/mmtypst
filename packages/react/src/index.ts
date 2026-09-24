import { typstToMathMLBody } from "mmtypst";
import type { TypstToMathMLBodyOptions } from "mmtypst";
import { createElement } from "react";
import type { HTMLAttributes, ReactElement, Ref } from "react";

export interface MathProps
  extends
    Omit<HTMLAttributes<MathMLElement>, "children" | "dangerouslySetInnerHTML" | "display">,
    TypstToMathMLBodyOptions {
  /** Typst math expression without its surrounding `$` delimiters. */
  source: string;
  /** Ref to the rendered MathML element. */
  ref?: Ref<MathMLElement>;
}

/** Renders a Typst math expression as a native MathML element. */
export function Math({
  source,
  display = "inline",
  throwOnError,
  symbols,
  ref,
  ...mathProps
}: MathProps): ReactElement {
  const markup = {
    __html: typstToMathMLBody(source, { display, throwOnError, symbols }),
  };

  return createElement("math", {
    ...mathProps,
    ref,
    xmlns: "http://www.w3.org/1998/Math/MathML",
    display,
    dangerouslySetInnerHTML: markup,
  });
}
