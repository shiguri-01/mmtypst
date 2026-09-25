# @mmtypst/react

Render Typst math expressions as native MathML in React. This package uses
[`mmtypst`](https://github.com/shiguri-01/mmtypst) and supports client rendering and SSR.

## Install

```bash
npm install @mmtypst/react
```

React 19 is required as a peer dependency.

## Usage

```tsx
import { Math } from "@mmtypst/react";

export function Equation() {
  return (
    <Math
      source="x = (-b plus.minus sqrt(b^2 - 4 a c)) / (2 a)"
      display="block"
      className="equation"
      aria-label="Quadratic formula"
    />
  );
}
```

Pass the expression without surrounding `$` delimiters. `display` defaults to
`"inline"`; use `"block"` for a standalone equation. `symbols` adds or
overrides symbol mappings. Set `throwOnError` to throw on invalid input; by
default, errors render as MathML `<merror>` elements.

The component accepts ordinary `<math>` attributes and a `ref` to the MathML
element. Its content comes from `mmtypst` and updates when `source` or options
change. No browser-only API is used during rendering.
