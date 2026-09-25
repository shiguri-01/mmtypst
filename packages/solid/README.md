# @mmtypst/solid

Render Typst math expressions as native MathML in Solid. This package uses
[`mmtypst`](https://github.com/shiguri-01/mmtypst) and supports client rendering and SSR.

## Install

```bash
npm install @mmtypst/solid
```

Solid 1.9 or later is required as a peer dependency.

## Usage

```tsx
import { Math } from "@mmtypst/solid";

export function Equation() {
  return (
    <Math
      source="x = (-b plus.minus sqrt(b^2 - 4 a c)) / (2 a)"
      display="block"
      class="equation"
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
element. Its content updates reactively when `source` or options change.
