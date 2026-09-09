/**
 * Typst mathematical symbols, operators, delimiters, and functions.
 *
 * Single Source of Truth (SSOT) for:
 * - Symbol definitions and Unicode mappings
 * - Mathematical operator precedence
 * - Delimiters and fences
 * - Shorthand replacements
 * - Recognized math functions, accents, decorations, and font variants
 */

import type { Token, TokenType } from "./types.ts";

export enum Precedence {
  NONE = 0,
  RELATION = 1, // =, !=, <, >, <=, >=, ->, =>, etc.
  ADD = 2, // +, -
  MUL = 3, // *, times, div
  IMPLICIT_MUL = 4, // juxtaposition: 2x, sin x, a b
  FRAC = 5, // /
  PREFIX = 6, // unary -, +
  ATTACH = 7, // _, ^
  POSTFIX = 8, // !, '
  CALL = 9, // f(...)
  PRIMARY = 10,
}

export type DelimiterClass = "open" | "close" | "neutral";

export interface DelimiterSpec {
  readonly class: DelimiterClass;
  readonly pair?: string;
}

/**
 * Registry of mathematical delimiters and fences.
 * Contains only canonical delimiter characters and their structural properties.
 */
export const DELIMITERS: Readonly<Record<string, DelimiterSpec>> = {
  // Parentheses
  "(": { class: "open", pair: ")" },
  ")": { class: "close", pair: "(" },
  // Brackets
  "[": { class: "open", pair: "]" },
  "]": { class: "close", pair: "[" },
  // Braces
  "{": { class: "open", pair: "}" },
  "}": { class: "close", pair: "{" },
  // Semantic / double brackets
  "⟦": { class: "open", pair: "⟧" },
  "⟧": { class: "close", pair: "⟦" },
  // Angle brackets
  "⟨": { class: "open", pair: "⟩" },
  "⟩": { class: "close", pair: "⟨" },
  "⟪": { class: "open", pair: "⟫" },
  "⟫": { class: "close", pair: "⟪" },
  // Floor and ceiling
  "⌊": { class: "open", pair: "⌋" },
  "⌋": { class: "close", pair: "⌊" },
  "⌈": { class: "open", pair: "⌉" },
  "⌉": { class: "close", pair: "⌈" },
  // White / tortoiseshell brackets
  "⦍": { class: "open", pair: "⦐" },
  "⦐": { class: "close", pair: "⦍" },
  "⦏": { class: "open", pair: "⦎" },
  "⦎": { class: "close", pair: "⦏" },
  // Neutral fences
  "|": { class: "neutral", pair: "|" },
  "‖": { class: "neutral", pair: "‖" },
};

export interface ShorthandDef {
  readonly pattern: string;
  readonly replacement: string;
  readonly type: TokenType;
}

/**
 * Single Source of Truth for all Typst math mode textual shorthands.
 * Ordered strictly by pattern length descending for greedy longest-prefix matching.
 */
export const SHORTHANDS: readonly ShorthandDef[] = [
  // 4-character shorthands
  { pattern: "<==>", replacement: "⟺", type: "OPERATOR" },
  { pattern: "<-->", replacement: "⟷", type: "OPERATOR" },

  // 3-character shorthands
  { pattern: "<=>", replacement: "⇔", type: "OPERATOR" },
  { pattern: "==>", replacement: "⟹", type: "OPERATOR" },
  { pattern: "<==", replacement: "⟸", type: "OPERATOR" },
  { pattern: "-->", replacement: "⟶", type: "OPERATOR" },
  { pattern: "<--", replacement: "⟵", type: "OPERATOR" },
  { pattern: "<->", replacement: "↔", type: "OPERATOR" },
  { pattern: "|->", replacement: "↦", type: "OPERATOR" },
  { pattern: "::=", replacement: "⩴", type: "OPERATOR" },
  { pattern: "<<<", replacement: "⋘", type: "OPERATOR" },
  { pattern: ">>>", replacement: "⋙", type: "OPERATOR" },
  { pattern: "...", replacement: "…", type: "IDENT" },

  // 2-character shorthands
  { pattern: ":=", replacement: "≔", type: "OPERATOR" },
  { pattern: "=:", replacement: "≕", type: "OPERATOR" },
  { pattern: "!=", replacement: "≠", type: "OPERATOR" },
  { pattern: "<=", replacement: "≤", type: "OPERATOR" },
  { pattern: ">=", replacement: "≥", type: "OPERATOR" },
  { pattern: "<<", replacement: "≪", type: "OPERATOR" },
  { pattern: ">>", replacement: "≫", type: "OPERATOR" },
  { pattern: "->", replacement: "→", type: "OPERATOR" },
  { pattern: "<-", replacement: "←", type: "OPERATOR" },
  { pattern: "=>", replacement: "⇒", type: "OPERATOR" },
  { pattern: "[|", replacement: "⟦", type: "OPEN_DELIM" },
  { pattern: "|]", replacement: "⟧", type: "CLOSE_DELIM" },
  { pattern: "||", replacement: "‖", type: "OPERATOR" },

  // 1-character Typst math mode operator shorthands
  { pattern: "*", replacement: "⋅", type: "OPERATOR" },
  { pattern: "-", replacement: "−", type: "OPERATOR" },
];

/** Delimiter shorthands in Typst */
export const DELIMITER_SHORTHANDS: Readonly<Record<string, string>> = {
  "[|": "⟦",
  "|]": "⟧",
  "||": "‖",
};

export function isOpeningDelimiter(char: string): boolean {
  return DELIMITERS[char]?.class === "open";
}

export function isClosingDelimiter(char: string): boolean {
  return DELIMITERS[char]?.class === "close";
}

export function isFence(char: string): boolean {
  return char in DELIMITERS;
}

export function getMatchingDelimiter(delim: string): string {
  const resolved = DELIMITER_SHORTHANDS[delim] ?? delim;
  return DELIMITERS[resolved]?.pair ?? resolved;
}

/**
 * Symbol definition.
 */
export interface SymbolDef {
  readonly unicode: string;
  readonly type: "ident" | "op" | "largeop" | "rel" | "punct" | "space" | "fence";
}

/**
 * Built-in Typst mathematical symbols.
 */
export const SYMBOLS: Readonly<Record<string, SymbolDef>> = {
  // --- Greek Lowercase ---
  alpha: { unicode: "α", type: "ident" },
  beta: { unicode: "β", type: "ident" },
  gamma: { unicode: "γ", type: "ident" },
  delta: { unicode: "δ", type: "ident" },
  epsilon: { unicode: "ε", type: "ident" },
  "epsilon.alt": { unicode: "ϵ", type: "ident" },
  zeta: { unicode: "ζ", type: "ident" },
  eta: { unicode: "η", type: "ident" },
  theta: { unicode: "θ", type: "ident" },
  "theta.alt": { unicode: "ϑ", type: "ident" },
  iota: { unicode: "ι", type: "ident" },
  kappa: { unicode: "κ", type: "ident" },
  "kappa.alt": { unicode: "ϰ", type: "ident" },
  lambda: { unicode: "λ", type: "ident" },
  mu: { unicode: "μ", type: "ident" },
  nu: { unicode: "ν", type: "ident" },
  xi: { unicode: "ξ", type: "ident" },
  omicron: { unicode: "ο", type: "ident" },
  pi: { unicode: "π", type: "ident" },
  "pi.alt": { unicode: "ϖ", type: "ident" },
  rho: { unicode: "ρ", type: "ident" },
  "rho.alt": { unicode: "ϱ", type: "ident" },
  sigma: { unicode: "σ", type: "ident" },
  "sigma.alt": { unicode: "ς", type: "ident" },
  tau: { unicode: "τ", type: "ident" },
  upsilon: { unicode: "υ", type: "ident" },
  phi: { unicode: "φ", type: "ident" },
  "phi.alt": { unicode: "ϕ", type: "ident" },
  chi: { unicode: "χ", type: "ident" },
  psi: { unicode: "ψ", type: "ident" },
  omega: { unicode: "ω", type: "ident" },

  // --- Greek Uppercase ---
  Alpha: { unicode: "Α", type: "ident" },
  Beta: { unicode: "Β", type: "ident" },
  Gamma: { unicode: "Γ", type: "ident" },
  Delta: { unicode: "Δ", type: "ident" },
  Epsilon: { unicode: "Ε", type: "ident" },
  Zeta: { unicode: "Ζ", type: "ident" },
  Eta: { unicode: "Η", type: "ident" },
  Theta: { unicode: "Θ", type: "ident" },
  "Theta.alt": { unicode: "ϴ", type: "ident" },
  Iota: { unicode: "Ι", type: "ident" },
  Kappa: { unicode: "Κ", type: "ident" },
  Lambda: { unicode: "Λ", type: "ident" },
  Mu: { unicode: "Μ", type: "ident" },
  Nu: { unicode: "Ν", type: "ident" },
  Xi: { unicode: "Ξ", type: "ident" },
  Omicron: { unicode: "Ο", type: "ident" },
  Pi: { unicode: "Π", type: "ident" },
  Rho: { unicode: "Ρ", type: "ident" },
  Sigma: { unicode: "Σ", type: "ident" },
  Tau: { unicode: "Τ", type: "ident" },
  Upsilon: { unicode: "Υ", type: "ident" },
  Phi: { unicode: "Φ", type: "ident" },
  Chi: { unicode: "Χ", type: "ident" },
  Psi: { unicode: "Ψ", type: "ident" },
  Omega: { unicode: "Ω", type: "ident" },

  // --- Large Operators ---
  sum: { unicode: "∑", type: "largeop" },
  product: { unicode: "∏", type: "largeop" },
  "product.co": { unicode: "∐", type: "largeop" },
  integral: { unicode: "∫", type: "largeop" },
  "integral.double": { unicode: "∬", type: "largeop" },
  "integral.triple": { unicode: "∭", type: "largeop" },
  "integral.quad": { unicode: "⨌", type: "largeop" },
  "integral.cont": { unicode: "∮", type: "largeop" },
  "integral.surf": { unicode: "∯", type: "largeop" },
  "integral.vol": { unicode: "∰", type: "largeop" },
  union: { unicode: "∪", type: "largeop" },
  "union.big": { unicode: "⋃", type: "largeop" },
  "union.plus": { unicode: "⊎", type: "largeop" },
  "union.plus.big": { unicode: "⨄", type: "largeop" },
  "union.sq": { unicode: "⊔", type: "largeop" },
  "union.sq.big": { unicode: "⨆", type: "largeop" },
  inter: { unicode: "∩", type: "largeop" },
  "inter.big": { unicode: "⋂", type: "largeop" },
  "inter.sq": { unicode: "⊓", type: "largeop" },
  "inter.sq.big": { unicode: "⨅", type: "largeop" },
  "and.big": { unicode: "⋀", type: "largeop" },
  "or.big": { unicode: "⋁", type: "largeop" },
  "plus.o.big": { unicode: "⨁", type: "largeop" },
  "times.o.big": { unicode: "⨂", type: "largeop" },
  "dot.o.big": { unicode: "⨀", type: "largeop" },

  // --- Relations ---
  eq: { unicode: "=", type: "rel" },
  "eq.not": { unicode: "≠", type: "rel" },
  "eq.def": { unicode: "≝", type: "rel" },
  "eq.triple": { unicode: "≡", type: "rel" },
  "eq.quad": { unicode: "≣", type: "rel" },
  "colon.eq": { unicode: "≔", type: "rel" },
  "colon.double.eq": { unicode: "⩴", type: "rel" },
  "eq.colon": { unicode: "≕", type: "rel" },
  approx: { unicode: "≈", type: "rel" },
  "approx.eq": { unicode: "≊", type: "rel" },
  "tilde.op": { unicode: "∼", type: "rel" },
  "tilde.eq": { unicode: "≃", type: "rel" },
  "tilde.equiv": { unicode: "≅", type: "rel" },
  prop: { unicode: "∝", type: "rel" },
  lt: { unicode: "<", type: "rel" },
  gt: { unicode: ">", type: "rel" },
  "lt.eq": { unicode: "≤", type: "rel" },
  "gt.eq": { unicode: "≥", type: "rel" },
  "lt.double": { unicode: "≪", type: "rel" },
  "gt.double": { unicode: "≫", type: "rel" },
  "lt.triple": { unicode: "⋘", type: "rel" },
  "gt.triple": { unicode: "⋙", type: "rel" },
  prec: { unicode: "≺", type: "rel" },
  "prec.eq": { unicode: "⪯", type: "rel" },
  succ: { unicode: "≻", type: "rel" },
  "succ.eq": { unicode: "⪰", type: "rel" },
  subset: { unicode: "⊂", type: "rel" },
  "subset.eq": { unicode: "⊆", type: "rel" },
  "subset.neq": { unicode: "⊊", type: "rel" },
  supset: { unicode: "⊃", type: "rel" },
  "supset.eq": { unicode: "⊇", type: "rel" },
  "supset.neq": { unicode: "⊋", type: "rel" },
  in: { unicode: "∈", type: "rel" },
  "in.not": { unicode: "∉", type: "rel" },
  "in.rev": { unicode: "∋", type: "rel" },
  parallel: { unicode: "∥", type: "rel" },
  perp: { unicode: "⟂", type: "rel" },

  // --- Arrows ---
  "arrow.r": { unicode: "→", type: "rel" },
  "arrow.l": { unicode: "←", type: "rel" },
  "arrow.t": { unicode: "↑", type: "rel" },
  "arrow.b": { unicode: "↓", type: "rel" },
  "arrow.l.r": { unicode: "↔", type: "rel" },
  "arrow.r.double": { unicode: "⇒", type: "rel" },
  "arrow.l.double": { unicode: "⇐", type: "rel" },
  "arrow.l.r.double": { unicode: "⇔", type: "rel" },
  "arrow.r.long": { unicode: "⟶", type: "rel" },
  "arrow.l.long": { unicode: "⟵", type: "rel" },
  "arrow.l.r.long": { unicode: "⟷", type: "rel" },
  "arrow.r.double.long": { unicode: "⟹", type: "rel" },
  "arrow.l.double.long": { unicode: "⟸", type: "rel" },
  "arrow.l.r.double.long": { unicode: "⟺", type: "rel" },
  "arrow.r.bar": { unicode: "↦", type: "rel" },
  "arrow.r.hook": { unicode: "↪", type: "rel" },
  "arrow.l.hook": { unicode: "↩", type: "rel" },
  "arrow.r.squiggly": { unicode: "⇝", type: "rel" },
  "arrow.l.squiggly": { unicode: "⇜", type: "rel" },
  "arrow.r.long.squiggly": { unicode: "⟿", type: "rel" },
  "arrow.l.long.squiggly": { unicode: "⬳", type: "rel" },
  "arrow.r.twohead": { unicode: "↠", type: "rel" },
  "arrow.l.twohead": { unicode: "↞", type: "rel" },
  "arrow.r.tail": { unicode: "↣", type: "rel" },
  "arrow.l.tail": { unicode: "↢", type: "rel" },

  // --- Arithmetic & Logic Operators ---
  times: { unicode: "×", type: "op" },
  div: { unicode: "÷", type: "op" },
  "plus.minus": { unicode: "±", type: "op" },
  "minus.plus": { unicode: "∓", type: "op" },
  "ast.op": { unicode: "∗", type: "op" },
  "star.op": { unicode: "⋆", type: "op" },
  compose: { unicode: "∘", type: "op" },
  bullet: { unicode: "•", type: "op" },
  "bullet.op": { unicode: "∙", type: "op" },
  "dot.op": { unicode: "⋅", type: "op" },
  "dot.c": { unicode: "·", type: "op" },
  "plus.o": { unicode: "⊕", type: "op" },
  "times.o": { unicode: "⊗", type: "op" },
  "dot.o": { unicode: "⊙", type: "op" },
  "minus.o": { unicode: "⊖", type: "op" },
  and: { unicode: "∧", type: "op" },
  or: { unicode: "∨", type: "op" },
  not: { unicode: "¬", type: "op" },

  // --- Differential Operators ---
  dif: { unicode: "d", type: "op" },
  Dif: { unicode: "D", type: "op" },

  // --- Miscellaneous Symbols ---
  infinity: { unicode: "∞", type: "ident" },
  oo: { unicode: "∞", type: "ident" },
  nabla: { unicode: "∇", type: "op" },
  partial: { unicode: "∂", type: "ident" },
  forall: { unicode: "∀", type: "op" },
  exists: { unicode: "∃", type: "op" },
  "exists.not": { unicode: "∄", type: "op" },
  nothing: { unicode: "∅", type: "ident" },
  emptyset: { unicode: "∅", type: "ident" },
  "dots.h": { unicode: "…", type: "ident" },
  "dots.h.c": { unicode: "⋯", type: "ident" },
  "dots.v": { unicode: "⋮", type: "ident" },
  "dots.down": { unicode: "⋱", type: "ident" },
  "dots.up": { unicode: "⋰", type: "ident" },
  planck: { unicode: "ħ", type: "ident" },
  Re: { unicode: "ℜ", type: "ident" },
  Im: { unicode: "ℑ", type: "ident" },
  aleph: { unicode: "א", type: "ident" },
  angle: { unicode: "∠", type: "ident" },
  degree: { unicode: "°", type: "ident" },
  prime: { unicode: "′", type: "ident" },
  "prime.double": { unicode: "″", type: "ident" },
  "prime.triple": { unicode: "‴", type: "ident" },
  "prime.quad": { unicode: "⁗", type: "ident" },

  // --- Blackboard Bold Sets ---
  RR: { unicode: "ℝ", type: "ident" },
  NN: { unicode: "ℕ", type: "ident" },
  ZZ: { unicode: "ℤ", type: "ident" },
  QQ: { unicode: "ℚ", type: "ident" },
  CC: { unicode: "ℂ", type: "ident" },

  // --- Named Delimiters and Fences ---
  "bracket.l": { unicode: "[", type: "fence" },
  "bracket.r": { unicode: "]", type: "fence" },
  "bracket.l.stroked": { unicode: "⟦", type: "fence" },
  "bracket.r.stroked": { unicode: "⟧", type: "fence" },
  "bracket.l.double": { unicode: "⟦", type: "fence" },
  "bracket.r.double": { unicode: "⟧", type: "fence" },
  "bracket.double.l": { unicode: "⟦", type: "fence" },
  "bracket.double.r": { unicode: "⟧", type: "fence" },
  "bracket.t": { unicode: "⎴", type: "fence" },
  "bracket.b": { unicode: "⎵", type: "fence" },
  "paren.l": { unicode: "(", type: "fence" },
  "paren.r": { unicode: ")", type: "fence" },
  "brace.l": { unicode: "{", type: "fence" },
  "brace.r": { unicode: "}", type: "fence" },
  "angle.l": { unicode: "⟨", type: "fence" },
  "angle.r": { unicode: "⟩", type: "fence" },
  "angle.l.double": { unicode: "⟪", type: "fence" },
  "angle.r.double": { unicode: "⟫", type: "fence" },
  "floor.l": { unicode: "⌊", type: "fence" },
  "floor.r": { unicode: "⌋", type: "fence" },
  "ceil.l": { unicode: "⌈", type: "fence" },
  "ceil.r": { unicode: "⌉", type: "fence" },
};

/**
 * Additive binary operators (Precedence.ADD).
 */
const ADD_OPERATORS: ReadonlySet<string> = new Set([
  "+",
  "-",
  "−",
  "±",
  "∓",
  "plus.minus",
  "minus.plus",
]);

/**
 * Multiplicative binary operators (Precedence.MUL).
 */
const MUL_OPERATORS: ReadonlySet<string> = new Set([
  "*",
  "⋅",
  "×",
  "÷",
  "∗",
  "⋆",
  "∘",
  "•",
  "∙",
  "⊕",
  "⊗",
  "⊙",
  "⊖",
  "∧",
  "∨",
  "times",
  "div",
]);

/**
 * Relation operators (Precedence.RELATION).
 * Initialized with ASCII and shorthand relation operators, then augmented with
 * all Unicode characters defined with type "rel" in SYMBOLS.
 */
const RELATION_OPERATORS = new Set<string>([
  "=",
  "!=",
  ":=",
  "::=",
  "=:",
  "<",
  ">",
  "<=",
  ">=",
  "<<",
  ">>",
  "<<<",
  ">>>",
  "->",
  "<-",
  "<->",
  "=>",
  "<=>",
  "<==>",
  "-->",
  "<--",
  "<-->",
  "==>",
  "<==",
  "|->",
]);

for (const sym of Object.values(SYMBOLS)) {
  if (sym.type === "rel") {
    RELATION_OPERATORS.add(sym.unicode);
  }
}

/**
 * Returns the binary operator precedence for a token, or Precedence.NONE if not a binary operator.
 */
export function getBinaryPrecedence(token: Token): Precedence {
  const val = token.value;

  if (ADD_OPERATORS.has(val)) {
    return Precedence.ADD;
  }
  if (MUL_OPERATORS.has(val)) {
    return Precedence.MUL;
  }
  if (RELATION_OPERATORS.has(val)) {
    return Precedence.RELATION;
  }

  if (token.type === "IDENT") {
    const sym = SYMBOLS[val];
    if (sym) {
      if (sym.type === "rel") return Precedence.RELATION;
      if (sym.type === "op") return Precedence.MUL;
    }
  }

  return Precedence.NONE;
}

/**
 * Checks whether a token is a binary operator.
 */
export function isBinaryOperator(token: Token): boolean {
  return getBinaryPrecedence(token) !== Precedence.NONE;
}

/**
 * Standard named mathematical operators (typeset in upright/normal font).
 */
export const MATH_FUNCTIONS: ReadonlySet<string> = new Set([
  "arccos",
  "arcsin",
  "arctan",
  "arg",
  "cos",
  "cosh",
  "cot",
  "coth",
  "csc",
  "csch",
  "ctg",
  "deg",
  "det",
  "dim",
  "exp",
  "gcd",
  "hom",
  "id",
  "im",
  "inf",
  "ker",
  "lcm",
  "lg",
  "lim",
  "liminf",
  "limsup",
  "ln",
  "log",
  "max",
  "min",
  "mod",
  "Pr",
  "sec",
  "sech",
  "sin",
  "sinc",
  "sinh",
  "sup",
  "tan",
  "tanh",
  "tg",
  "tr",
]);

/**
 * Large operators that by default take limits (above/below) in display mode.
 */
export const LIMIT_OPERATORS: ReadonlySet<string> = new Set([
  "sum",
  "product",
  "product.co",
  "integral",
  "integral.double",
  "integral.triple",
  "integral.quad",
  "integral.cont",
  "integral.surf",
  "integral.vol",
  "union.big",
  "inter.big",
  "and.big",
  "or.big",
  "plus.o.big",
  "times.o.big",
  "dot.o.big",
  "union.plus.big",
  "lim",
  "limsup",
  "liminf",
  "min",
  "max",
  "sup",
  "inf",
  "gcd",
  "lcm",
  "∑",
  "∏",
  "∐",
  "∫",
  "∬",
  "∭",
  "⨌",
  "∮",
  "∯",
  "∰",
  "⋃",
  "⋂",
  "⋀",
  "⋁",
  "⨁",
  "⨂",
  "⨀",
  "⨄",
]);

/**
 * Accent functions and corresponding MathML accent characters.
 */
export const ACCENT_SYMBOLS: Readonly<Record<string, string>> = {
  grave: "`",
  acute: "´",
  "acute.double": "˝",
  hat: "^",
  tilde: "~",
  macron: "¯",
  dash: "‾",
  breve: "˘",
  caron: "ˇ",
  dot: "˙",
  "dot.double": "¨",
  diaer: "¨",
  "dot.triple": "⃛",
  "dot.quad": "⃜",
  circle: "∘",
  arrow: "→",
  "arrow.l": "←",
  "arrow.l.r": "↔",
  harpoon: "⇀",
  "harpoon.lt": "↼",
};

/**
 * Standard horizontal spacing constants in Typst math mode.
 */
export const SPACES: Readonly<Record<string, string>> = {
  thin: "0.1667em",
  med: "0.2222em",
  thick: "0.2778em",
  quad: "1em",
  wide: "2em",
};

/**
 * Font variant functions and their MathML mathvariant mappings.
 */
export const FONT_VARIANTS: Readonly<Record<string, string>> = {
  bold: "bold",
  italic: "italic",
  upright: "normal",
  bb: "double-struck",
  cal: "script",
  frak: "fraktur",
  sans: "sans-serif",
  mono: "monospace",
};
