# mmtypst

Render [Typst](https://typst.app/) math in the browser with MathML.

`mmtypst` converts standalone Typst math expressions to MathML in pure JavaScript, so you don't need to ship the full Typst compiler as a large WASM binary.

It works in browsers as well as Node.js, Bun, Deno, and edge runtimes, making it usable for SSR and SSG too.

## Install

```bash
npm install mmtypst
```

## Usage

Pass a Typst math expression to `typstToMathML` without the surrounding `$`
delimiters. It returns a complete `<math>` element as a string, ready to insert
into the DOM or include in server-rendered HTML.

```ts
import { typstToMathML } from "mmtypst";

const mathml = typstToMathML("x = (-b plus.minus sqrt(b^2 - 4 a c)) / (2 a)");

document.querySelector(".equation")!.innerHTML = mathml;
```

Expressions render inline by default. Use `display: "block"` to display an
equation on its own line:

```ts
const blockMathML = typstToMathML("e^(i pi) = -1", {
  display: "block",
});
```

### Options

All options are optional.

| Option         | Type                     | Default     | Description                                               |
| -------------- | ------------------------ | ----------- | --------------------------------------------------------- |
| `display`      | `"inline" \| "block"`    | `"inline"`  | Display mode.                                             |
| `throwOnError` | `boolean`                | `false`     | Throw on errors instead of returning a MathML `<merror>`. |
| `class`        | `string`                 | `undefined` | CSS class for the root `<math>` element.                  |
| `attributes`   | `Record<string, string>` | `{}`        | Additional attributes for the root element.               |
| `symbols`      | `Record<string, string>` | `{}`        | Add or override symbol mappings.                          |

The lower-level `tokenize`, `parse`, and `generateMathML` functions are also exported.

## Fonts

`mmtypst` uses the browser's native MathML rendering and does not bundle fonts.
Browsers provide the basic mathematical layout and select an available math
font. To explicitly request the browser's math font, add:

```css
math {
  font-family: math;
}
```

The selected font and rendering vary across browsers and devices. For more
consistent results, load a math web font before the `math` fallback.

For example, download [STIX Two Math](https://github.com/stipub/stixfonts), serve
`STIXTwoMath-Regular.woff2` from your site's `/fonts/` directory, and add this CSS:

```css
@font-face {
  font-family: "STIX Two Math";
  src: url("/fonts/STIXTwoMath-Regular.woff2") format("woff2");
  font-display: swap;
}

math {
  font-family: "STIX Two Math", math;
}
```

Layout may still vary across browsers, even with the same font. See
[Fonts for MathML](https://developer.mozilla.org/en-US/docs/Web/MathML/Guides/Fonts)
for more about math fonts and platform support.

## Limitations

`mmtypst` targets standalone math syntax from Typst 0.15.1.

- Typst code is not evaluated, including variable definitions, imports, and
  `set`/`show` rules.
- Embedded `#` expressions are not supported. Use math syntax directly:
  write `alpha` instead of `#math.alpha` or `#sym.alpha`, and `sqrt(x)` instead
  of `#math.sqrt($x$)`.

## References

- [Typst math reference](https://typst.app/docs/reference/math/)
- [MathML Core](https://www.w3.org/TR/mathml-core/)

## License

MIT
