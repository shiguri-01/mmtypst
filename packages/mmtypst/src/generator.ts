import { combineFontVariant, toMathAlphanumeric } from "./math-fonts.ts";
import { resolveAST } from "./semantic.ts";
import {
  ACCENT_SYMBOLS,
  FONT_VARIANTS,
  getMatchingDelimiter,
  isFence,
  LIMIT_OPERATORS,
  MATH_FUNCTIONS,
  SYMBOLS,
} from "./symbols.ts";
import type {
  ASTNode,
  AttachNode,
  BinaryOpNode,
  CasesNode,
  FractionNode,
  FunctionCallNode,
  GroupNode,
  IdentNode,
  MatrixNode,
  NumberNode,
  OperatorNode,
  RowNode,
  SpaceNode,
  StringNode,
  TableNode,
  RenderMathMLBodyOptions,
  RenderMathMLOptions,
  UnaryOpNode,
} from "./types.ts";

export interface RenderContext {
  readonly options: RenderMathMLBodyOptions;
  readonly displayStyle: boolean;
  readonly forceLimits?: boolean;
  readonly fontVariant?: string;
}

/**
 * Generates MathML XML string from a parsed AST.
 */
export function generateMathML(node: ASTNode, options: RenderMathMLOptions = {}): string {
  const display = options.display ?? "inline";
  const innerMathML = generateMathMLBody(node, options);

  const attrs: string[] = ['xmlns="http://www.w3.org/1998/Math/MathML"'];
  attrs.push(`display="${display}"`);
  if (options.class) {
    attrs.push(`class="${escapeAttr(options.class)}"`);
  }
  if (options.attributes) {
    for (const [key, val] of Object.entries(options.attributes)) {
      if (/^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(key)) {
        attrs.push(`${key}="${escapeAttr(val)}"`);
      }
    }
  }

  return `<math ${attrs.join(" ")}>${innerMathML}</math>`;
}

/** Generates the MathML content for a caller-provided `<math>` element. */
export function generateMathMLBody(node: ASTNode, options: RenderMathMLBodyOptions = {}): string {
  const resolved = resolveAST(node, options);
  const ctx: RenderContext = {
    options,
    displayStyle: (options.display ?? "inline") === "block",
  };
  return renderNode(resolved, ctx);
}

export function renderNode(node: ASTNode, ctx: RenderContext): string {
  switch (node.type) {
    case "Number":
      return renderNumber(node, ctx);
    case "Ident":
      return renderIdent(node, ctx);
    case "String":
      return renderString(node);
    case "Operator":
      return renderOperator(node, ctx);
    case "BinaryOp":
      return renderBinaryOp(node, ctx);
    case "UnaryOp":
      return renderUnaryOp(node, ctx);
    case "Fraction":
      return renderFraction(node, ctx);
    case "Attach":
      return renderAttach(node, ctx);
    case "FunctionCall":
      return renderFunctionCall(node, ctx);
    case "Group":
      return renderGroup(node, ctx);
    case "Matrix":
      return renderMatrix(node, ctx);
    case "Cases":
      return renderCases(node, ctx);
    case "Row":
      return renderRow(node, ctx);
    case "Table":
      return renderTable(node, ctx);
    case "Space":
      return renderSpace(node);
    case "LayoutMarker":
      return "<mrow/>";
    case "Error":
      return renderError(node.message, ctx);
    default:
      return "";
  }
}

function renderNumber(node: NumberNode, ctx?: RenderContext): string {
  const value = ctx?.fontVariant ? toMathAlphanumeric(node.value, ctx.fontVariant) : node.value;
  return `<mn>${escapeText(value)}</mn>`;
}

function renderIdent(node: IdentNode, ctx: RenderContext): string {
  const text = node.name;
  const mathvariant = node.mathvariant ?? ctx.fontVariant;

  if (mathvariant) {
    return `<mi mathvariant="normal">${escapeText(toMathAlphanumeric(text, mathvariant))}</mi>`;
  }
  return `<mi>${escapeText(text)}</mi>`;
}

function renderString(node: StringNode): string {
  return `<mtext>${escapeText(node.value)}</mtext>`;
}

function renderOperator(node: OperatorNode, ctx: RenderContext): string {
  const op = node.operator === "-" ? "−" : node.operator;
  const fenceAttr = isFence(op) ? ' fence="true"' : "";
  const stretchyAttr = node.stretchy ? ' stretchy="true"' : "";
  const limitsAttr = ctx.forceLimits ? ' movablelimits="false"' : "";
  return `<mo${fenceAttr}${stretchyAttr}${limitsAttr}>${escapeText(op)}</mo>`;
}

function renderBinaryOp(node: BinaryOpNode, ctx: RenderContext): string {
  const left = renderNode(node.left, ctx);
  const right = renderNode(node.right, ctx);
  const op = node.operator === "-" ? "−" : node.operator;
  return `<mrow>${left}<mo>${escapeText(op)}</mo>${right}</mrow>`;
}

function renderUnaryOp(node: UnaryOpNode, ctx: RenderContext): string {
  const arg = renderNode(node.argument, ctx);
  const op = node.operator === "-" ? "−" : node.operator;
  if (node.position === "postfix") {
    return `<mrow>${arg}<mo>${escapeText(op)}</mo></mrow>`;
  }
  return `<mrow><mo>${escapeText(op)}</mo>${arg}</mrow>`;
}

function renderFraction(node: FractionNode, ctx: RenderContext): string {
  const childCtx = { ...ctx, displayStyle: false };
  const num = renderNode(node.numerator, childCtx);
  const den = renderNode(node.denominator, childCtx);
  return `<mfrac><mrow>${num}</mrow><mrow>${den}</mrow></mfrac>`;
}

function usesLimits(base: ASTNode, displayStyle: boolean, fallback = false): boolean {
  if (base.type === "FunctionCall" && base.args[0]) {
    if (base.name === "limits") {
      return true;
    }
    if (base.name === "scripts") {
      return false;
    }
    if (base.name === "display" || base.name === "inline") {
      return usesLimits(base.args[0], base.name === "display", fallback);
    }
    if (Object.hasOwn(FONT_VARIANTS, base.name)) {
      return usesLimits(base.args[0], displayStyle, fallback);
    }
  }
  const name =
    base.sourceName ??
    (base.type === "Operator" ? base.operator : base.type === "Ident" ? base.name : "");
  if (name.startsWith("integral") || /^[∫∬∭⨌∮∯∰]$/.test(name)) {
    return false;
  }
  return displayStyle && (LIMIT_OPERATORS.has(name) || fallback);
}

function renderAttach(node: AttachNode, ctx: RenderContext): string {
  const limits = usesLimits(node.base, ctx.displayStyle, node.isLimits);
  const childCtx = { ...ctx, displayStyle: false, forceLimits: false };
  const script = (value: ASTNode | undefined) => (value ? renderNode(value, childCtx) : undefined);
  let base = renderNode(node.base, { ...ctx, forceLimits: limits });
  const subscript = script(node.subscript);
  let superscript = script(node.superscript);
  if (node.primes) {
    const primes = `<mo>${"′".repeat(node.primes)}</mo>`;
    if (limits) {
      base = `<msup>${base}${primes}</msup>`;
    } else {
      superscript = superscript ? `<mrow>${primes}${superscript}</mrow>` : primes;
    }
  }

  if (subscript && superscript) {
    const tag = limits ? "munderover" : "msubsup";
    base = `<${tag}>${base}${subscript}${superscript}</${tag}>`;
  } else if (subscript) {
    const tag = limits ? "munder" : "msub";
    base = `<${tag}>${base}${subscript}</${tag}>`;
  } else if (superscript) {
    const tag = limits ? "mover" : "msup";
    base = `<${tag}>${base}${superscript}</${tag}>`;
  }

  const corners = [node.topLeft, node.bottomLeft, node.topRight, node.bottomRight];
  if (corners.every((value) => value === undefined)) {
    return base;
  }

  const bottomRight = script(node.bottomRight) ?? "<mrow/>";
  const topRight = script(node.topRight) ?? "<mrow/>";
  const bottomLeft = script(node.bottomLeft) ?? "<mrow/>";
  const topLeft = script(node.topLeft) ?? "<mrow/>";

  return (
    `<mmultiscripts>${base}${bottomRight}${topRight}` +
    `<mprescripts/>${bottomLeft}${topLeft}</mmultiscripts>`
  );
}

// Built-in fence functions: abs, norm, floor, ceil, round
const FENCE_FUNCTIONS: Readonly<Record<string, readonly [open: string, close: string]>> = {
  abs: ["|", "|"],
  norm: ["‖", "‖"],
  floor: ["⌊", "⌋"],
  ceil: ["⌈", "⌉"],
  round: ["⌊", "⌉"],
  "bracket.stroked": ["⟦", "⟧"],
};

// Built-in decoration functions: overline, underline, overbrace, underbrace
const DECORATION_FUNCTIONS: Readonly<Record<string, (inner: string) => string>> = {
  overline: (inner) => `<mover accent="true">${inner}<mo>¯</mo></mover>`,
  underline: (inner) => `<munder accentunder="true">${inner}<mo>_</mo></munder>`,
  overbrace: (inner) => `<mover>${inner}<mo>⏞</mo></mover>`,
  underbrace: (inner) => `<munder>${inner}<mo>⏟</mo></munder>`,
};

// Built-in layout style functions: limits, scripts, display, inline, lr
const STYLE_FUNCTIONS = new Set(["limits", "scripts", "display", "inline", "lr"]);

function renderFunctionCall(node: FunctionCallNode, ctx: RenderContext): string {
  const name = node.name;
  const args = node.args;

  // Explicit frac function: frac(a, b)
  if (name === "frac") {
    const childCtx = { ...ctx, displayStyle: false };
    const num = args[0] ? renderNode(args[0], childCtx) : "";
    const den = args[1] ? renderNode(args[1], childCtx) : "";
    return `<mfrac><mrow>${num}</mrow><mrow>${den}</mrow></mfrac>`;
  }

  // Radical functions: sqrt(x), root(degree, radicand)
  if (name === "sqrt") {
    const inner = args[0] ? renderNode(args[0], ctx) : "";
    return `<msqrt>${inner}</msqrt>`;
  }
  if (name === "root") {
    return renderRoot(node, ctx);
  }

  // Binomial coefficient: binom(n, k)
  if (name === "binom") {
    return renderBinomial(node, ctx);
  }

  // Multiscripts attach function: attach(base, t: ..., b: ...)
  if (name === "attach") {
    return renderAttachmentCall(node, ctx);
  }

  // Mathematical fence functions: abs(x), norm(x), floor(x), ceil(x), round(x)
  if (Object.hasOwn(FENCE_FUNCTIONS, name)) {
    const [open, close] = FENCE_FUNCTIONS[name];
    const inner = args.map((a) => renderNode(a, ctx)).join("");
    return `<mrow><mo fence="true">${escapeText(open)}</mo>${inner}<mo fence="true">${escapeText(close)}</mo></mrow>`;
  }

  // Over-accents: hat(x), tilde(x), dot(x), etc.
  if (Object.hasOwn(ACCENT_SYMBOLS, name)) {
    const accentChar = ACCENT_SYMBOLS[name];
    const inner = args.map((a) => renderNode(a, ctx)).join("");
    return `<mover accent="true">${inner}<mo>${escapeText(accentChar)}</mo></mover>`;
  }

  // Over/under decorations: overline(x), underline(x), overbrace(x), underbrace(x)
  if (Object.hasOwn(DECORATION_FUNCTIONS, name)) {
    const inner = args.map((a) => renderNode(a, ctx)).join("");
    return DECORATION_FUNCTIONS[name](inner);
  }

  // Style modifiers: limits, scripts, display, inline, lr
  if (STYLE_FUNCTIONS.has(name)) {
    if (name === "display" || name === "inline") {
      const displayStyle = name === "display";
      const subCtx = { ...ctx, displayStyle };
      const inner = args.map((argument) => renderNode(argument, subCtx)).join("");
      return `<mstyle displaystyle="${displayStyle}">${inner}</mstyle>`;
    }
    if (name === "limits" || name === "scripts") {
      return renderNode(args[0], ctx);
    }
    return `<mrow>${renderNode(args[0], ctx)}</mrow>`;
  }

  // Font variants: bold(x), italic(x), bb(x), etc.
  if (Object.hasOwn(FONT_VARIANTS, name)) {
    const variant = FONT_VARIANTS[name];
    const combined = combineFontVariant(ctx.fontVariant, variant);
    const subCtx: RenderContext = { ...ctx, fontVariant: combined };
    return args.map((a) => renderNode(a, subCtx)).join("");
  }

  // Standard upright math operators: sin(x), cos(x), log(x)
  const innerArgs = args.map((a) => renderNode(a, ctx)).join("<mo>,</mo>");
  const variant = MATH_FUNCTIONS.has(name) ? ' mathvariant="normal"' : "";
  const replacement =
    ctx.options.symbols && Object.hasOwn(ctx.options.symbols, name)
      ? ctx.options.symbols[name]
      : undefined;
  const symbol = SYMBOLS[name];
  const callee = replacement ?? symbol?.unicode ?? name;
  const tag =
    symbol && ["op", "largeop", "rel", "fence", "punct"].includes(symbol.type) ? "mo" : "mi";
  return `<mrow><${tag}${variant}>${escapeText(callee)}</${tag}><mo fence="true">(</mo>${innerArgs}<mo fence="true">)</mo></mrow>`;
}

function renderRoot(node: FunctionCallNode, ctx: RenderContext): string {
  const degree = renderNode(node.args[0], { ...ctx, displayStyle: false });
  const radicand = renderNode(node.args[1], ctx);
  return `<mroot>${radicand}${degree}</mroot>`;
}

function renderBinomial(node: FunctionCallNode, ctx: RenderContext): string {
  const args = node.args;

  const childCtx = { ...ctx, displayStyle: false };
  const upper = renderNode(args[0], childCtx);
  const lower = args
    .slice(1)
    .map((a) => renderNode(a, childCtx))
    .join("<mo>,</mo>");
  return `<mrow><mo>(</mo><mfrac linethickness="0"><mrow>${upper}</mrow><mrow>${lower}</mrow></mfrac><mo>)</mo></mrow>`;
}

function renderAttachmentCall(node: FunctionCallNode, ctx: RenderContext): string {
  const args = node.args;
  const namedArgs = node.namedArgs ?? {};

  const arg = (key: string): ASTNode | undefined => {
    const value = namedArgs[key];
    return typeof value === "string" ? { type: "String", value } : value;
  };
  return renderAttach(
    {
      type: "Attach",
      base: args[0],
      subscript: arg("b"),
      superscript: arg("t"),
      bottomLeft: arg("bl"),
      topLeft: arg("tl"),
      bottomRight: arg("br"),
      topRight: arg("tr"),
    },
    ctx,
  );
}

function renderGroup(node: GroupNode, ctx: RenderContext): string {
  const body = renderNode(node.body, ctx);
  const openMo = node.open ? `<mo fence="true">${escapeText(node.open)}</mo>` : "";
  const closeMo = node.close ? `<mo fence="true">${escapeText(node.close)}</mo>` : "";
  return `<mrow>${openMo}${body}${closeMo}</mrow>`;
}

function renderMatrix(node: MatrixNode, ctx: RenderContext): string {
  const openFence = node.delimiter;
  const closeFence = getMatchingDelimiter(openFence);

  const rowsXml = node.rows
    .map((row) => {
      const cellsXml = row.map((cell) => `<mtd>${renderNode(cell, ctx)}</mtd>`).join("");
      return `<mtr>${cellsXml}</mtr>`;
    })
    .join("");

  const tableXml = `<mtable>${rowsXml}</mtable>`;
  return `<mrow><mo fence="true">${escapeText(openFence)}</mo>${tableXml}<mo fence="true">${escapeText(closeFence)}</mo></mrow>`;
}

function renderCases(node: CasesNode, ctx: RenderContext): string {
  const rowsXml = node.cases
    .map((branch) => {
      const expression = renderNode(branch.expression, ctx);
      if (branch.condition !== undefined) {
        const condition = renderNode(branch.condition, ctx);
        return (
          `<mtr><mtd style="text-align: right">${expression}</mtd>` +
          `<mtd style="text-align: left">${condition}</mtd></mtr>`
        );
      }
      return `<mtr><mtd>${expression}</mtd></mtr>`;
    })
    .join("");

  const openFence = node.delimiter ?? "{";
  const openMo = openFence ? `<mo fence="true">${escapeText(openFence)}</mo>` : "";

  return `<mrow>${openMo}<mtable class="cases">${rowsXml}</mtable></mrow>`;
}

function renderRow(node: RowNode, ctx: RenderContext): string {
  const childrenXml = node.children.map((c) => renderNode(c, ctx)).join("");
  return `<mrow>${childrenXml}</mrow>`;
}

function renderTable(node: TableNode, ctx: RenderContext): string {
  const classAttr = node.className ? ` class="${escapeAttr(node.className)}"` : "";
  const rowsXml = node.rows
    .map((row) => {
      const cellsXml = row
        .map((cell, index) => {
          const alignment = index % 2 ? "left" : "right";
          const content = renderNode(cell, ctx);
          return `<mtd style="text-align: ${alignment}">${content}</mtd>`;
        })
        .join("");
      return `<mtr>${cellsXml}</mtr>`;
    })
    .join("");

  return `<mtable${classAttr}>${rowsXml}</mtable>`;
}

function renderSpace(node: SpaceNode): string {
  return `<mspace width="${escapeAttr(node.width)}"/>`;
}

function renderError(message: string, ctx: RenderContext): string {
  if (ctx.options.throwOnError) {
    throw new Error(message);
  }
  return `<merror><mtext>${escapeText(message)}</mtext></merror>`;
}

function escapeText(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return escapeText(str).replace(/"/g, "&quot;");
}
