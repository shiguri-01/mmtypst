import { MATH_FUNCTIONS, SPACES, SYMBOLS } from "./symbols.ts";
import type { ASTNode, AttachNode, CaseBranch, ParseError, Token, TokenType } from "./types.ts";

interface ParseState {
  readonly tokens: readonly Token[];
  readonly pos: number;
}

type ParseResult<T> =
  | { readonly ok: true; readonly value: T; readonly state: ParseState }
  | { readonly ok: false; readonly error: ParseError; readonly state: ParseState };

export function createState(tokens: readonly Token[]): ParseState {
  return { tokens, pos: 0 };
}

export function peek(state: ParseState, offset = 0): Token {
  return (
    state.tokens[state.pos + offset] ?? {
      type: "EOF",
      value: "",
      start: state.tokens.at(-1)?.end ?? 0,
      end: state.tokens.at(-1)?.end ?? 0,
    }
  );
}

export function isAtEnd(state: ParseState): boolean {
  return peek(state).type === "EOF";
}

export function consume(state: ParseState): { token: Token; nextState: ParseState } {
  return { token: peek(state), nextState: { ...state, pos: state.pos + 1 } };
}

function next(state: ParseState): ParseState {
  return consume(state).nextState;
}

function failure(state: ParseState, message: string): ParseResult<never> {
  return { ok: false, error: { type: "CustomError", message, position: peek(state).start }, state };
}

export function expect(state: ParseState, type: TokenType): ParseResult<Token> {
  return peek(state).type === type
    ? { ok: true, value: peek(state), state: next(state) }
    : failure(state, `Expected ${type}`);
}

function closing(token: Token): boolean {
  return ["RPAREN", "CLOSE_DELIM", "RBRACKET", "RBRACE"].includes(token.type);
}

function opening(token: Token): boolean {
  return ["LPAREN", "OPEN_DELIM", "LBRACKET", "LBRACE"].includes(token.type);
}

function compactRow(children: readonly ASTNode[]): ASTNode {
  return children.length === 1
    ? children[0]
    : { type: "Row", children, start: children[0]?.start, end: children.at(-1)?.end };
}

function unparen(node: ASTNode): ASTNode {
  return node.type === "Group" && node.open === "(" && node.close === ")" ? node.body : node;
}

function operator(token: Token): ASTNode {
  return { type: "Operator", operator: token.value, start: token.start, end: token.end };
}

export function parsePrimary(state: ParseState): ParseResult<ASTNode> {
  const token = peek(state);
  const after = next(state);
  if (["EOF", "CARET", "UNDERSCORE", "SLASH"].includes(token.type)) {
    return failure(state, "Expected expression");
  }
  if (opening(token)) {
    return parseGroup(state);
  }
  if (token.type === "AMPERSAND" || token.type === "LINEBREAK") {
    return {
      ok: true,
      value: {
        type: "LayoutMarker",
        kind: token.type === "AMPERSAND" ? "alignment" : "linebreak",
        start: token.start,
        end: token.end,
      },
      state: after,
    };
  }
  if (token.type === "ROOT") {
    const radicand = parseExpression(after, ATTACH_PREC);
    if (!radicand.ok) return radicand;
    const index = token.value === "∛" ? "3" : token.value === "∜" ? "4" : undefined;
    return {
      ok: true,
      value: {
        type: "FunctionCall",
        name: index ? "root" : "sqrt",
        args: index
          ? [{ type: "Number", value: index }, unparen(radicand.value)]
          : [unparen(radicand.value)],
        start: token.start,
        end: radicand.value.end,
      },
      state: radicand.state,
    };
  }
  if (token.type === "PRIMES") {
    return {
      ok: true,
      value: {
        type: "Operator",
        operator: "′".repeat(token.value.length),
        start: token.start,
        end: token.end,
      },
      state: after,
    };
  }
  if (token.type === "NUMBER" || token.type === "STRING") {
    return {
      ok: true,
      value: {
        type: token.type === "NUMBER" ? "Number" : "String",
        value: token.value,
        start: token.start,
        end: token.end,
      },
      state: after,
    };
  }
  if (token.type === "LITERAL") {
    const value: ASTNode = /^\p{L}$/u.test(token.value)
      ? { type: "Ident", name: token.value, start: token.start, end: token.end }
      : operator(token);
    return { ok: true, value, state: after };
  }
  if (token.type === "ATOM") {
    return {
      ok: true,
      value: {
        type: "Ident",
        name: token.value,
        isUnknown: false,
        start: token.start,
        end: token.end,
      },
      state: after,
    };
  }
  if (token.type === "IDENT") {
    return parseIdentifier(state);
  }

  if (
    token.type === "OPERATOR" ||
    token.type === "COLON" ||
    closing(token) ||
    token.type === "COMMA" ||
    token.type === "SEMICOLON"
  ) {
    if (token.value === "#") {
      return failure(state, "Embedded Typst code (#) is not supported");
    }
    if (token.value === "$") {
      return failure(state, "Pass math content without $ delimiters");
    }
    return { ok: true, value: operator(token), state: after };
  }
  return failure(state, "Expected expression");
}

function parseIdentifier(state: ParseState): ParseResult<ASTNode> {
  const token = peek(state);
  const after = next(state);
  const name = token.value;
  if (peek(after).type === "LPAREN" && token.end === peek(after).start) {
    const call = parseFunctionCall(after, name);
    return call.ok ? { ...call, value: { ...call.value, start: token.start } } : call;
  }
  if (Object.hasOwn(SPACES, name)) {
    return {
      ok: true,
      value: {
        type: "Space",
        width: SPACES[name],
        sourceName: name,
        start: token.start,
        end: token.end,
      },
      state: after,
    };
  }
  if (Object.hasOwn(SYMBOLS, name)) {
    const symbol = SYMBOLS[name];
    const span = { sourceName: name, start: token.start, end: token.end };
    const isOperator = ["op", "largeop", "rel", "fence", "punct"].includes(symbol.type);
    const value: ASTNode = isOperator
      ? { type: "Operator", operator: symbol.unicode, ...span }
      : { type: "Ident", name: symbol.unicode, ...span };
    return { ok: true, value, state: after };
  }

  return {
    ok: true,
    value: {
      type: "Ident",
      name,
      isUnknown: Array.from(name).length > 1 && !MATH_FUNCTIONS.has(name),
      mathvariant: MATH_FUNCTIONS.has(name) ? "normal" : undefined,
      start: token.start,
      end: token.end,
    },
    state: after,
  };
}

/** A group can have mixed delimiters, or an absent close, in Typst math. */
export function parseGroup(state: ParseState): ParseResult<ASTNode> {
  const open = peek(state);
  const body = parseContent(next(state), (t) => closing(t));
  if (!body.ok) {
    return body;
  }
  const close = peek(body.state);
  const hasClose = closing(close);
  if (!hasClose) {
    return { ok: true, value: compactRow([operator(open), body.value]), state: body.state };
  }
  return {
    ok: true,
    value: {
      type: "Group",
      open: open.value,
      close: close.value,
      body: body.value,
      isFence: true,
      start: open.start,
      end: close.end,
    },
    state: next(body.state),
  };
}

function namedArgument(state: ParseState): boolean {
  const name = peek(state);
  const colon = peek(state, 1);
  return (
    (name.type === "IDENT" || (name.type === "ATOM" && /^\p{XID_Start}/u.test(name.value))) &&
    colon.type === "COLON" &&
    name.end === colon.start
  );
}

/** Shared arguments and delimiter-option parsing for all supported calls. */
export function parseFunctionCall(state: ParseState, name: string): ParseResult<ASTNode> {
  const open = expect(state, "LPAREN");
  if (!open.ok) {
    return open;
  }
  let cursor = open.state;
  const args: ASTNode[] = [];
  const rows: ASTNode[][] = [];
  let row: ASTNode[] = [];
  const named: Record<string, ASTNode> = Object.create(null);
  const layout = name === "mat" || name === "vec" || name === "cases";

  while (!isAtEnd(cursor) && peek(cursor).type !== "RPAREN") {
    if (namedArgument(cursor)) {
      const key = peek(cursor).value;
      if (Object.hasOwn(named, key)) {
        return failure(cursor, `Duplicate named argument: ${key}`);
      }
      if (layout && key !== "delim") {
        return failure(cursor, `Unsupported named argument for ${name}: ${key}`);
      }

      cursor = next(next(cursor));
      if (isAtEnd(cursor) || callBoundary(peek(cursor))) {
        return failure(cursor, `Expected value for ${key}`);
      }
      const value = parseContent(cursor, callBoundary);
      if (!value.ok) {
        return value;
      }
      named[key] = value.value;
      cursor = value.state;
    } else {
      const value = parseContent(cursor, callBoundary);
      if (!value.ok) {
        return value;
      }
      args.push(value.value);
      row.push(value.value);
      cursor = value.state;
    }
    const separator = peek(cursor);
    if (separator.type === "SEMICOLON") {
      if (name !== "mat") {
        return failure(cursor, "Array arguments separated by semicolons are supported only in mat");
      }

      rows.push(row);
      row = [];
      cursor = next(cursor);
    } else if (separator.type === "COMMA") {
      cursor = next(cursor);
    } else if (separator.type !== "RPAREN") {
      return failure(cursor, "Expected comma or closing parenthesis");
    }
  }

  const close = expect(cursor, "RPAREN");
  if (!close.ok) {
    return close;
  }
  const span = { start: open.value.start, end: close.value.end };
  if (!layout) {
    return {
      ok: true,
      value: {
        type: "FunctionCall",
        name,
        args,
        namedArgs: Object.keys(named).length ? named : undefined,
        ...span,
      },
      state: close.state,
    };
  }

  let delimiter = name === "cases" ? "{" : "(";
  if (named.delim) {
    const value = named.delim;
    if (value.type === "String") {
      delimiter = value.value;
    } else if (value.type === "Operator") {
      delimiter = value.operator;
    } else if (value.type === "Ident") {
      delimiter = value.name;
    } else {
      return failure(cursor, "Delimiter must be a string or symbol");
    }
  }

  if (name === "mat") {
    if (row.length) {
      rows.push(row);
    }
    return { ok: true, value: { type: "Matrix", delimiter, rows, ...span }, state: close.state };
  }

  if (name === "vec") {
    return {
      ok: true,
      value: { type: "Matrix", delimiter, rows: args.map((arg) => [arg]), ...span },
      state: close.state,
    };
  }

  const branches: CaseBranch[] = [];
  for (const arg of args) {
    if (arg.type === "Table") {
      if (arg.rows.length !== 1 || arg.rows[0].length > 2) {
        return failure(cursor, "cases supports one alignment point per branch");
      }
      branches.push({ expression: arg.rows[0][0], condition: arg.rows[0][1] });
    } else {
      branches.push({ expression: arg });
    }
  }
  return {
    ok: true,
    value: { type: "Cases", delimiter, cases: branches, ...span },
    state: close.state,
  };
}

function callBoundary(token: Token): boolean {
  return ["COMMA", "SEMICOLON", "RPAREN"].includes(token.type);
}

// Typst 0.15.1 math_expr_prec / math_op:
// https://github.com/typst/typst/blob/v0.15.1/crates/typst-syntax/src/parser.rs
// Arithmetic symbols are atoms. Only these syntactic operators bind atoms;
// juxtaposition is collected by parseContent, outside the precedence parser.
const FRAC_PREC = 1;
const ATTACH_PREC = 2; // Also roots and implicit/explicit function calls.
const FACTORIAL_PREC = 3;

export function parseExpression(
  state: ParseState,
  minPrec = 0,
  stopScripts: readonly TokenType[] = [],
): ParseResult<ASTNode> {
  const first = parsePrimary(state);
  if (!first.ok) return first;
  let left = first.value;
  let cursor = first.state;

  // Alphabetic atoms, strings, escapes and primes group with one directly
  // following delimiter pair. Numbers, shorthands and completed calls don't.
  const initial = peek(state);
  const continuable =
    ["STRING", "LITERAL", "PRIMES"].includes(initial.type) ||
    (initial.type === "ATOM" && /^\p{Alphabetic}+$/u.test(initial.value)) ||
    (initial.type === "IDENT" &&
      left.type !== "FunctionCall" &&
      left.type !== "Matrix" &&
      left.type !== "Cases");
  if (
    continuable &&
    minPrec <= ATTACH_PREC &&
    opening(peek(cursor)) &&
    peek(cursor, -1).end === peek(cursor).start
  ) {
    const group = parseGroup(cursor);
    if (!group.ok) return group;
    left = compactRow([left, group.value]);
    cursor = group.state;
  }

  while (!isAtEnd(cursor) && !stopScripts.includes(peek(cursor).type)) {
    const token = peek(cursor);
    const adjacent = peek(cursor, -1).end === token.start;
    const isFraction = token.type === "SLASH";
    const isPrime = token.type === "PRIMES" && adjacent;
    const isScript = token.type === "CARET" || token.type === "UNDERSCORE";
    const isFactorial = token.type === "OPERATOR" && token.value === "!" && adjacent;
    const precedence = isFraction
      ? FRAC_PREC
      : isScript || isPrime
        ? ATTACH_PREC
        : isFactorial
          ? FACTORIAL_PREC
          : -1;
    if (precedence < minPrec) break;
    cursor = next(cursor);

    if (isFactorial) {
      left = compactRow([left, operator(token)]);
      continue;
    }
    if (isFraction) {
      if (isAtEnd(cursor)) return failure(cursor, "Expected denominator after /");
      const denominator = parseExpression(cursor, precedence + 1);
      if (!denominator.ok) return denominator;
      left = {
        type: "Fraction",
        numerator: unparen(left),
        denominator: unparen(denominator.value),
        start: left.start,
        end: denominator.value.end,
      };
      cursor = denominator.state;
      continue;
    }

    // Equal scripts associate right. Opposite scripts chain at the same
    // level; after consuming a chain member it no longer stops the RHS.
    let chain: TokenType[] = ["CARET", "UNDERSCORE"];
    chain = chain.filter((kind) => kind !== token.type);
    const scripts: { superscript?: ASTNode; subscript?: ASTNode; primes?: number } = {};
    if (isPrime) {
      scripts.primes = token.value.length;
    } else {
      const operand = parseExpression(cursor, precedence, chain);
      if (!operand.ok) return operand;
      scripts[token.type === "CARET" ? "superscript" : "subscript"] = unparen(operand.value);
      cursor = operand.state;
    }
    // A prime may not interrupt the enclosing attachment chain.
    if (!(isPrime && stopScripts.includes(peek(cursor).type))) {
      while (chain.includes(peek(cursor).type)) {
        const kind = peek(cursor).type;
        chain = chain.filter((item) => item !== kind);
        const operand = parseExpression(next(cursor), precedence, chain);
        if (!operand.ok) return operand;
        scripts[kind === "CARET" ? "superscript" : "subscript"] = unparen(operand.value);
        cursor = operand.state;
      }
    }
    left = {
      type: "Attach",
      base: left,
      ...scripts,
      start: left.start,
      end: peek(cursor, -1).end,
    } satisfies AttachNode;
  }
  return { ok: true, value: left, state: cursor };
}

/** Content is a sequence, optionally split into explicit rows/alignment cells. */
function parseContent(state: ParseState, stop: (token: Token) => boolean): ParseResult<ASTNode> {
  let cursor = state;
  const rows: ASTNode[][] = [];
  let cells: ASTNode[] = [];
  let expressions: ASTNode[] = [];
  let hadLayout = false;

  const flushCell = () => {
    cells.push(compactRow(expressions));
    expressions = [];
  };

  const flushRow = () => {
    flushCell();
    rows.push(cells);
    cells = [];
  };

  while (!isAtEnd(cursor) && !stop(peek(cursor))) {
    const token = peek(cursor);
    if (token.type === "NEWLINE") {
      cursor = next(cursor);
      continue;
    }
    const expression = parseExpression(cursor);
    if (!expression.ok) {
      return expression;
    }
    if (expression.state.pos <= cursor.pos) {
      return failure(cursor, "Parser made no progress");
    }
    if (expression.value.type === "LayoutMarker") {
      hadLayout = true;
      if (expression.value.kind === "linebreak") flushRow();
      else flushCell();
    } else {
      expressions.push(expression.value);
    }
    cursor = expression.state;
  }
  if (!hadLayout) {
    return { ok: true, value: compactRow(expressions), state: cursor };
  }
  flushRow();
  return {
    ok: true,
    value: {
      type: "Table",
      rows,
      className: "aligned",
      start: peek(state).start,
      end: peek(cursor).start,
    },
    state: cursor,
  };
}

export function parseEquation(state: ParseState): ParseResult<ASTNode> {
  return parseContent(state, () => false);
}

export function parse(tokens: readonly Token[]): ASTNode {
  const result = parseEquation(createState(tokens));
  if (result.ok) {
    return result.value;
  }
  const diagnostic: ParseError = result.error;
  return {
    type: "Error",
    message: diagnostic.type === "CustomError" ? diagnostic.message : "Syntax error",
    diagnostic,
    start: diagnostic.position,
    end: peek(result.state).end,
  };
}
