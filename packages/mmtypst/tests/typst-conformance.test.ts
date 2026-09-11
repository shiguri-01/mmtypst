import { spawnSync } from "node:child_process";

import { describe, expect, test } from "vite-plus/test";

import { parse, tokenize, typstToMathML } from "../src/index.ts";
import { SYMBOLS } from "../src/symbols.ts";
import type { ASTNode } from "../src/types.ts";

// Binding expectations checked against Typst 0.15.1, especially its tests:
// https://github.com/typst/typst/tree/v0.15.1/tests/suite/math
// Normalize presentation-only sequence wrappers and whitespace, but retain
// every fraction, attachment, delimiter pair and root boundary.
type Tree = string | number | null | Tree[];
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

function astTree(node: ASTNode): Tree {
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
      if (node.name === "root") return root(args.at(-1)!, args.length === 2 ? args[0] : null);
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

const cases: [string, Tree][] = [
  ["-a/b", row("−", frac("a", "b"))],
  ["a/-b/c", row(frac("a", "−"), frac("b", "c"))],
  ["a^-b^c", row(attach("a", "−"), attach("b", "c"))],
  ["a^-^b", attach("a", attach("−", "b"))],
  ["a/-^b", frac("a", attach("−", "b"))],
  ["a/-!b", row(frac("a", row("−", "!")), "b")],
  ["x^(-1)", attach("x", row("−", "1"))],
  ["x_(-1)", attach("x", null, row("−", "1"))],
  ["a/(-b)/c", frac(frac("a", row("−", "b")), "c")],
  ["a+b*c=d", row("a", "+", "b", "∗", "c", "=", "d")],
  ["a b/c", row("a", frac("b", "c"))],
  ["a/b c", row(frac("a", "b"), "c")],
  ["a/b/c", frac(frac("a", "b"), "c")],
  ["a/(b/c)", frac("a", frac("b", "c"))],
  ["(a+b)/(c-d)", frac(row("a", "+", "b"), row("c", "−", "d"))],
  ["((a))/b", frac(group("a"), "b")],
  ["a^b/c^d", frac(attach("a", "b"), attach("c", "d"))],
  ["a^b^c", attach("a", attach("b", "c"))],
  ["a_b_c", attach("a", null, attach("b", null, "c"))],
  ["a^b_c^d", attach("a", "b", attach("c", "d"))],
  ["a_b^c_d", attach("a", attach("c", null, "d"), "b")],
  ["a^b_c_d", attach("a", "b", attach("c", null, "d"))],
  ["a^*b", row(attach("a", "∗"), "b")],
  ["a / * b", row(frac("a", "∗"), "b")],
  ["a^=b", row(attach("a", "="), "b")],
  ["a/=b", row(frac("a", "="), "b")],
  ["a^,b", row(attach("a", ","), "b")],
  ["a/;b", row(frac("a", ";"), "b")],
  ["x^)", attach("x", ")")],
  ["(1 /)", row("(", frac("1", ")"))],
  ["(x", row("(", "x")],
  ["(x]", group("x", "(", "]")],
  ["f[x]/b", frac(row("f", group("x", "[", "]")), "b")],
  ["f [x]/b", row("f", frac(group("x", "[", "]"), "b"))],
  ["f(x)/b", frac(row("f", group("x")), "b")],
  ["1(x)/b", row("1", frac("x", "b"))],
  ["a^f(x)", attach("a", row("f", group("x")))],
  ["a^f (x)", row(attach("a", "f"), group("x"))],
  ["f/* comment */(x)/b", row("f", frac("x", "b"))],
  ["'", "′"],
  ["''", "′′"],
  ["a'", attach("a", null, null, 1)],
  ["a'^b_c", attach("a", "b", "c", 1)],
  ["a'_b^c", attach("a", "c", "b", 1)],
  ["a^b'_c^d", attach("a", attach("b", null, null, 1), attach("c", "d"))],
  ["a' ' / b", row(attach("a", null, null, 1), frac("′", "b"))],
  ["a^'", attach("a", "′")],
  ["a!'", attach(row("a", "!"), null, null, 1)],
  ["a'!", row(attach("a", null, null, 1), "!")],
  ["a! / b!", frac(row("a", "!"), row("b", "!"))],
  ["a !/b", row("a", frac("!", "b"))],
  ["a^b!", attach("a", row("b", "!"))],
  ["√a^b/c", frac(root(attach("a", "b")), "c")],
  ["√(a/b)", root(frac("a", "b"))],
  ["∛a + ∜b", row(root("a", "3"), "+", root("b", "4"))],
  ["a^√b_c", attach("a", root(attach("b", null, "c")))],
  [".5/b", row(".", frac("5", "b"))],
  ["1.5/b", frac("1.5", "b")],
  ["a.b/c", row("a", ".", frac("b", "c"))],
  ["pi.alt/b", frac("ϖ", "b")],
  [String.raw`a/\-^b`, frac("a", attach("-", "b"))],
  [String.raw`a\^b/c`, row("a", "^", frac("b", "c"))],
  [String.raw`a\'b`, row("a", "'", "b")],
  ["a/*comment*/^b", attach("a", "b")],
  ["a/*comment*/'", row("a", "′")],
  ["alpha(x)/b", frac(row("α", group("x")), "b")],
  ["sin(x)/cos(x)", frac(row("sin", group("x")), row("cos", group("x")))],
  ["sqrt(a/b)", root(frac("a", "b"))],
  ["a[|x|]/b", frac(row("a", group("x", "⟦", "⟧")), "b")],
  ["a>= (x)/b", row("a", "≥", frac("x", "b"))],
  ["a>= (x)^b", row("a", "≥", attach(group("x"), "b"))],
  ["a^&b", row(attach("a", ["alignment"]), "b")],
  ["a/&b", row(frac("a", ["alignment"]), "b")],
  ["&^b", attach(["alignment"], "b")],
  [String.raw`a/\ b`, row(frac("a", ["linebreak"]), "b")],
  ["â/b", frac("â", "b")],
  ["â(x)/b", row("â", frac("x", "b"))],
  ["a^🏳️‍🌈", attach("a", "🏳️‍🌈")],
  ["１２/b", frac("１２", "b")],
  ["𝟙𝟚/b", frac("𝟙𝟚", "b")],
  ["a^->>b", row(attach("a", "↠"), "b")],
  ["a/~b", row(frac("a", "∼"), "b")],
  ["a^|=>b", row(attach("a", "⤇"), "b")],
  ["...(x)/b", row("…", frac("x", "b"))],
];

describe("Typst 0.15.1 math binding", () => {
  test.each(cases)("%s", (source, expected) => {
    expect(astTree(parse(tokenize(source)))).toEqual(expected);
    expect(typstToMathML(source)).not.toContain("<merror>");
  });

  test.each(["a/*b", "a/", "a^", "a_", "√", "a/^b"])("rejects incomplete syntax: %s", (source) => {
    expect(typstToMathML(source)).toContain("<merror>");
  });
});

// Optional live differential check. Ordinary tests use the expectations above
// without requiring a compiler. Set MMTYPST_VERIFY_TYPST=1 to check the whole
// generated corpus against the installed Typst 0.15.1 executable.
function typstTree(value: unknown): Tree {
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
    default:
      throw new Error(`Unexpected Typst element: ${JSON.stringify(node)}`);
  }
}

test.skipIf(process.env.MMTYPST_VERIFY_TYPST !== "1")(
  "matches the Typst compiler",
  () => {
    const version = spawnSync("typst", ["--version"], { encoding: "utf8" });
    expect(version.status, version.error?.message).toBe(0);
    expect(version.stdout).toMatch(/^typst 0\.15\.1 /);
    const corpus = new Set(cases.map(([source]) => source));
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
    const sources = [...corpus];
    const result = spawnSync(
      "typst",
      ["eval", "query(metadata).map(it => it.value)", "--in", "-"],
      {
        input: sources.map((source) => `#metadata($${source}$)`).join("\n"),
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        timeout: 30000,
      },
    );
    expect(result.status, result.stderr || result.error?.message).toBe(0);
    const expected = JSON.parse(result.stdout) as unknown[];
    expect(expected).toHaveLength(sources.length);
    const differences = sources.flatMap((source, i) => {
      const actualTree = astTree(parse(tokenize(source)));
      const expectedTree = typstTree(expected[i]);
      return JSON.stringify(actualTree) === JSON.stringify(expectedTree)
        ? []
        : [{ source, actualTree, expectedTree }];
    });
    expect(differences).toEqual([]);
    console.info(`Compared ${sources.length} expressions with ${version.stdout.trim()}`);
  },
  40000,
);
