import { SYMBOLS } from "../src/symbols.ts";
import type { ASTNode } from "../src/types.ts";

// Normalize presentation-only sequence wrappers and whitespace, but retain
// every fraction, attachment, delimiter pair and root boundary.
export type Tree = string | number | null | Tree[];
const row = (...items: Tree[]): Tree => {
  const children = items.flatMap((item) =>
    Array.isArray(item) && item[0] === "row" ? item.slice(1) : [item],
  );
  return children.length === 1 ? children[0] : ["row", ...children];
};
const frac = (a: Tree, b: Tree): Tree => ["frac", a, b];
const attach = (base: Tree, top: Tree = null, bottom: Tree = null, primes = 0): Tree => [
  "attach",
  base,
  top,
  bottom,
  primes,
];
const group = (body: Tree, open = "(", close = ")"): Tree => ["group", row(open, body, close)];
const root = (body: Tree, index: Tree = null): Tree => ["root", index, body];

export function astTree(node: ASTNode): Tree {
  switch (node.type) {
    case "Ident":
      return node.name;
    case "Number":
    case "String":
      return node.value;
    case "Operator":
      return node.operator;
    case "LayoutMarker":
      return [node.kind];
    case "Row":
      return row(...node.children.map(astTree));
    case "Table":
      return row(
        ...node.rows.flatMap((cells, i) => [
          ...(i ? [["linebreak"]] : []),
          ...cells.flatMap((cell, j) => [...(j ? [["alignment"]] : []), astTree(cell)]),
        ]),
      );
    case "Matrix":
      return ["matrix", node.delimiter, node.rows.map((cells) => cells.map(astTree))];
    case "Cases":
      return [
        "cases",
        node.delimiter ?? "{",
        ...node.cases.map(({ expression, condition }) =>
          condition
            ? row(astTree(expression), ["alignment"], astTree(condition))
            : astTree(expression),
        ),
      ];
    case "Fraction":
      return frac(astTree(node.numerator), astTree(node.denominator));
    case "Attach":
      return attach(
        astTree(node.base),
        node.superscript ? astTree(node.superscript) : null,
        node.subscript ? astTree(node.subscript) : null,
        node.primes,
      );
    case "Group":
      return group(astTree(node.body), node.open, node.close);
    case "FunctionCall": {
      const args = node.args.map(astTree);
      if (node.name === "sqrt") return root(args[0]);
      if (node.name === "root") return root(args[1], args[0]);
      if (node.name === "frac") return frac(args[0], args[1]);
      return row(
        SYMBOLS[node.name]?.unicode ?? node.name,
        group(row(...args.flatMap((arg, i) => (i ? [",", arg] : [arg])))),
      );
    }
    default:
      throw new Error(`Unexpected AST node in conformance test: ${node.type}`);
  }
}

export function typstTree(value: unknown): Tree {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  const node = value as Record<string, unknown>;
  switch (node.func) {
    case "equation":
      return typstTree(node.body);
    case "symbol":
    case "text":
      return String(node.text);
    case "space":
      return row();
    case "align-point":
      return ["alignment"];
    case "linebreak":
      return ["linebreak"];
    case "op":
      return typstTree(node.text);
    case "sequence":
      return row(...(node.children as unknown[]).map(typstTree));
    case "frac":
      return frac(typstTree(node.num), typstTree(node.denom));
    case "attach": {
      const primes = node.tr as { func: string; count: number } | undefined;
      if (primes && primes.func !== "primes") throw new Error("Unexpected top-right attachment");
      return attach(typstTree(node.base), typstTree(node.t), typstTree(node.b), primes?.count);
    }
    case "primes":
      return "′".repeat(Number(node.count));
    case "lr":
      return ["group", typstTree(node.body)];
    case "root":
      return root(typstTree(node.radicand), typstTree(node.index));
    case "mat":
      return [
        "matrix",
        ((node.delim as string[] | undefined) ?? ["("])[0],
        (node.rows as unknown[][]).map((cells) => cells.map(typstTree)),
      ];
    case "vec":
      return [
        "matrix",
        ((node.delim as string[] | undefined) ?? ["("])[0],
        (node.children as unknown[]).map((child) => [typstTree(child)]),
      ];
    case "cases":
      return [
        "cases",
        ((node.delim as string[] | undefined) ?? ["{"])[0],
        ...(node.children as unknown[]).map(typstTree),
      ];
    default:
      throw new Error(`Unexpected Typst element: ${JSON.stringify(node)}`);
  }
}

const cases = [
  "-a/b",
  "a/-b/c",
  "a^-b^c",
  "a^-^b",
  "a/-^b",
  "a/-!b",
  "x^(-1)",
  "x_(-1)",
  "a/(-b)/c",
  "a+b*c=d",
  "a b/c",
  "a/b c",
  "a/b/c",
  "a/(b/c)",
  "(a+b)/(c-d)",
  "((a))/b",
  "a^b/c^d",
  "a^b^c",
  "a_b_c",
  "a^b_c^d",
  "a_b^c_d",
  "a^b_c_d",
  "a^*b",
  "a / * b",
  "a^=b",
  "a/=b",
  "a^,b",
  "a/;b",
  "x^)",
  "(1 /)",
  "(x",
  "(x]",
  "f[x]/b",
  "f [x]/b",
  "f(x)/b",
  "1(x)/b",
  "a^f(x)",
  "a^f (x)",
  "f/* comment */(x)/b",
  "'",
  "''",
  "a'",
  "a'^b_c",
  "a'_b^c",
  "a^b'_c^d",
  "a' ' / b",
  "a^'",
  "a!'",
  "a'!",
  "a! / b!",
  "a !/b",
  "a^b!",
  "√a^b/c",
  "√(a/b)",
  "∛a + ∜b",
  "a^√b_c",
  ".5/b",
  "1.5/b",
  "a.b/c",
  "pi.alt/b",
  String.raw`a/\-^b`,
  String.raw`a\^b/c`,
  String.raw`a\'b`,
  "a/*comment*/^b",
  "a/*comment*/'",
  "alpha(x)/b",
  "sin(x)/cos(x)",
  "sqrt(a/b)",
  "a[|x|]/b",
  "a>= (x)/b",
  "a>= (x)^b",
  "a^&b",
  "a/&b",
  "&^b",
  String.raw`a/\ b`,
  "â/b",
  "â(x)/b",
  "a^🏳️‍🌈",
  "１２/b",
  "𝟙𝟚/b",
  "a^->>b",
  "a/~b",
  "a^|=>b",
  "...(x)/b",
  // Operator atoms, juxtaposition, and postfix binding (formerly MathML checks).
  "-x^2",
  "2 x + a b",
  "(a + b) * c",
  "n!",
  "-x!",
  "n! / k!",
  "a +",
  "n !",
  // Attachment and fraction operands unwrap only matching outer parentheses.
  "x_1",
  "x^2",
  "x_1^2",
  "x^y^z",
  "(x)_(y)",
  "x^(a + b)",
  "x^[y]",
  "x^{y}",
  "1 / 2",
  "(a + b) / (c + d)",
  "((x + 1)) / (y + 1)",
  "[a] / (b)",
  "frac(1, 1 + x)",
  "frac((x), (y))",
  "sqrt((x))",
  "root(3, x)",
  "sin(x, y)",
  "sum(x)",
  // Delimiter spellings and nesting retain the same group boundaries.
  "⟦x⟧",
  "⟦a + b⟧",
  "[|x|]",
  "[|a + b|]",
  "⟦a + b⟧ / 2",
  "x_⟦1⟧",
  "⟨x⟩",
  "⌊x⌋",
  "⌈x⌉",
  "⟦⌊x⌋⟧",
  // Comments, escapes, strings and newlines must keep their lexical boundaries.
  "",
  "x\ny",
  "a\nb",
  "x /* comment */ + y",
  "x + 1 // comment",
  "x + 1 // comment\n+ y",
  "/* outer /* inner */ */ x + 1",
  "a /* & */ b",
  '"a & b"',
  String.raw`"a\\b"`,
  String.raw`a \\ b`,
  String.raw`x\^2`,
  String.raw`\#`,
  String.raw`\u{1D400}`,
  String.raw`"\u{03B1}"`,
  // Reconstruct standalone layout markers from the parser's rows and cells.
  String.raw`a \ b`,
  String.raw`a &= b \ c`,
  String.raw`f(x) &= x + 1 \ &= 2`,
  "&a&",
  "a\\",
  // Matrix/vector arguments and case branches keep their row/cell boundaries.
  "mat(1, 2; 3, 4)",
  'mat(delim: "[", 1, 2; 3, 4)',
  "mat(frac(a, b), (c, d); x_1, y^2)",
  "vec(x)",
  "vec(1, 2, 3)",
  'cases(1 "if" x > 0, 0 "otherwise")',
  'cases(1 & "if" x > 0, 0 & "otherwise")',
  // Complete formulas exercise binding across several constructs.
  "x = (-b plus.minus sqrt(b^2 - 4 * a * c)) / (2 * a)",
  "e^(i * pi) + 1 = 0",
];

const corpus = new Set(cases);
// Exercise different atoms on both sides, every pair of structural
// operators, and both attachment orders. Spaces avoid comment syntax.
const atoms = [
  "a",
  "-",
  "+",
  "*",
  "=",
  "(a+b)",
  "[a]",
  '"x"',
  "alpha",
  "5",
  "'",
  String.raw`\-`,
  "√a",
  "f(x)",
];
const operators = ["/", "^", "_"];
for (const a of atoms)
  for (const b of atoms)
    for (const op of operators) {
      corpus.add(`${a} ${op} ${b}`);
    }
for (const a of atoms)
  for (const op1 of operators)
    for (const op2 of operators) {
      corpus.add(`a ${op1} ${a} ${op2} b`);
      corpus.add(`a ${op1} ${a}' ${op2} b`);
      corpus.add(`a ${op1} ${a}! ${op2} b`);
    }
for (const op1 of operators)
  for (const op2 of operators)
    for (const op3 of operators) {
      corpus.add(`a${op1}b${op2}c${op3}d`);
      corpus.add(`a${op1}b'${op2}c'${op3}d'`);
    }
// More interactions from Typst's frac/primes tests (no embedded code).
for (const source of [
  "a'_b^c",
  "a_b'^c",
  "a_b^c'",
  "a_b'^c'^d'",
  "(a'_b')^(c'_d')",
  "a_b'/c_d'",
  "a'^2^2",
  "a'_2_2",
  "f_n'^a'",
  "f^a'_n'",
  "a_'''^''^'",
  "n'!'",
  "n' !'",
  "a_n'!'^b",
  "n!'!",
  "n! '!",
  "a_n!'!^b",
  '"foo"[|x|]/2',
  "f [x]/2",
  "phi [x]/2",
  "+[x]/2",
  "1(x)/2",
  "2[x]/2",
  "(a)b/2",
  "b(a)[b]/2",
  "1/n!",
  "1/5!",
  "f'(x) / f_pi{x}",
  "sin^2(x) / f_0(x)",
  "f!(x) / g^(-1)(x)",
  String.raw`a_\u{2a}[|x} / a_"2a"{x|]`,
  "a(b)_c(d)^e(f) / g(h)'_i(j)'",
  "(x)'(x)'(x)' / (x)'(x)'(x)'",
  "a\n/\nb",
  "a\n^\nb",
  "a^b\n_c",
  "a/* comment */! / b",
  "a^*b",
  "a/=b",
])
  corpus.add(source);

export const sources = [...corpus];

export const invalidSources = [
  "a/*b",
  '"unterminated',
  "1 /",
  "a/",
  "a^",
  "a_",
  "√",
  "a/^b",
  "sqrt(x",
  "sqrt(x, y",
  "mat(1",
  "vec(1",
  "cases(1",
  "root(3)",
  "root(3, x, unexpected: 4)",
  "attach(x, unexpected: 1)",
  'mat(delim: "ab", 1)',
  'vec(delim: "ab", x)',
  'cases(x, delim: "ab")',
  String.raw`\u{12oops}`,
  String.raw`\u{D800}`,
];
