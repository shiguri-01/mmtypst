# Math parser contract

The syntax target is **Typst 0.15.1**. The reference is its
[math parser](https://github.com/typst/typst/blob/v0.15.1/crates/typst-syntax/src/parser.rs),
[lexer](https://github.com/typst/typst/blob/v0.15.1/crates/typst-syntax/src/lexer.rs),
and [math tests](https://github.com/typst/typst/tree/v0.15.1/tests/suite/math).
The documentation describes [fractions](https://typst.app/docs/reference/math/frac/)
and [attachments](https://typst.app/docs/reference/math/attach/); the versioned
implementation specifies their interactions.

## Findings and implementation

The previous parser imposed arithmetic precedence on math markup, then added
sign exceptions for fraction and script operands. Those exceptions prevented
further attachment to a sign: `a/-^b` attached `b` to the whole fraction.
Independent prime/script parsers also misplaced chains such as `a^b_c^d`.

The parser now follows the reference's separation of an expression from a
sequence of expressions. Ordinary symbols, including `+`, `-`, `*`, and `=`,
are atoms. Only syntactic operators create binding structure:

| Syntax                             | Binding                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `/`                                | Precedence 1, left associative                          |
| `^`, `_`                           | Precedence 2, right associative; opposite scripts chain |
| Adjacent primes                    | Precedence 2; may chain with both scripts               |
| Adjacent `!`                       | Precedence 3, postfix                                   |
| Root operand, function application | Precedence 2                                            |

The attachment loop shares one chaining set, including the reference's rule
that a prime cannot interrupt an enclosing script chain. Parentheses unwrap
only at fraction/script/root operand boundaries. Implicit calls depend on the
lexical atom and adjacency. Comments count as a gap; ordinary newlines behave
as whitespace. Escapes, prime runs, numeric atoms, and grapheme clusters keep
their lexical boundaries. `*` expands to `∗`, while `.5` starts with a separate
dot atom.

This removes the arithmetic precedence table, unary-prefix parser, and both
sign exceptions. Layout markers are collected into rows/cells only when they
remain standalone expressions; they can also occur as operands.

## AST compatibility

`parse()` now returns `Row` sequences for arithmetic expressions. It no longer
emits `BinaryOp` or `UnaryOp`. Their exported types and generator support remain
available for manually constructed ASTs. Prime shorthand uses `Attach.primes`
so it can coexist with both scripts and stay on the side of an operator with
limits. Single math graphemes use `ATOM` tokens, separate from named `IDENT`s.

Consumers inspecting ASTs or comparing literal MathML strings must account for
these structural changes. Rendering still uses the library's existing supported
symbol/function set; Typst code evaluation is outside its scope.

## Verification

`tests/typst-conformance.test.ts` contains fixed, compiler-checked expectations.
It also generates combinations of atoms, fractions, scripts, primes, and
factorials and compares them to the installed Typst 0.15.1 executable. It
normalizes sequence wrappers and ordinary spaces while retaining fraction,
attachment, root, and delimiter boundaries. This checks structure and symbol
text, not pixel-identical layout or the entire Typst standard library.

Normal tests do not require Typst. To run the live comparison from the workspace
root in PowerShell:

```powershell
$env:MMTYPST_VERIFY_TYPST = '1'
vp test packages/mmtypst/tests/typst-conformance.test.ts --reporter=verbose
```

On POSIX shells:

```sh
MMTYPST_VERIFY_TYPST=1 vp test packages/mmtypst/tests/typst-conformance.test.ts --reporter=verbose
```

The live check fails if the compiler is missing or has a different version.
