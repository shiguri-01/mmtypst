import {
  getBinaryPrecedence,
  isBinaryOperator,
  MATH_FUNCTIONS,
  Precedence,
  SPACES,
  SYMBOLS,
} from "./symbols.ts";
import type {
  ASTNode,
  CaseBranch,
  ParseError,
  ParseResult,
  ParseState,
  Token,
  TokenType,
} from "./types.ts";

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

function boundary(token: Token): boolean {
  return (
    closing(token) ||
    ["EOF", "COMMA", "SEMICOLON", "AMPERSAND", "LINEBREAK", "NEWLINE"].includes(token.type)
  );
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
  if (boundary(token)) {
    return failure(state, "Expected expression");
  }
  if (opening(token)) {
    return parseGroup(state);
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
  if (token.type === "IDENT") {
    return parseIdentifier(state);
  }

  if (token.type === "OPERATOR" || token.type === "COLON") {
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

export function parsePrefix(state: ParseState): ParseResult<ASTNode> {
  const token = peek(state);
  if (token.type === "OPERATOR" && ["+", "-", "−"].includes(token.value)) {
    const after = next(state);
    if (boundary(peek(after))) {
      return { ok: true, value: operator(token), state: after };
    }
    const operand = parseExpression(after, Precedence.PREFIX);
    if (!operand.ok) {
      return operand;
    }
    return {
      ok: true,
      value: {
        type: "UnaryOp",
        operator: token.value,
        argument: operand.value,
        position: "prefix",
        start: token.start,
        end: operand.value.end,
      },
      state: operand.state,
    };
  }
  return parsePrimary(state);
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
  return {
    ok: true,
    value: {
      type: "Group",
      open: open.value,
      close: hasClose ? close.value : "",
      body: body.value,
      isFence: true,
      start: open.start,
      end: hasClose ? close.end : close.start,
    },
    state: hasClose ? next(body.state) : body.state,
  };
}

function namedArgument(state: ParseState): boolean {
  const name = peek(state);
  const colon = peek(state, 1);
  return name.type === "IDENT" && colon.type === "COLON" && name.end === colon.start;
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
      if (boundary(peek(cursor))) {
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

/** Repeated identical attachments associate right; the opposite kind chains. */
function parseAttachment(state: ParseState, base: ASTNode): ParseResult<ASTNode> {
  const firstKind = peek(state).type;
  const opposite = firstKind === "CARET" ? "UNDERSCORE" : "CARET";
  const first = parseScriptOperand(next(state), opposite);
  if (!first.ok) {
    return first;
  }
  let cursor = first.state;
  let subscript = firstKind === "UNDERSCORE" ? first.value : undefined;
  let superscript = firstKind === "CARET" ? first.value : undefined;
  if (peek(cursor).type === opposite) {
    const second = parseScriptOperand(next(cursor), firstKind);
    if (!second.ok) {
      return second;
    }
    if (opposite === "UNDERSCORE") {
      subscript = second.value;
    } else {
      superscript = second.value;
    }
    cursor = second.state;
  }
  return {
    ok: true,
    value: {
      type: "Attach",
      base,
      subscript,
      superscript,
      start: base.start,
      end: peek(cursor, -1).end,
    },
    state: cursor,
  };
}

function parseScriptOperand(state: ParseState, stop: TokenType): ParseResult<ASTNode> {
  if (boundary(peek(state))) {
    return failure(state, "Expected script operand");
  }
  const result = parseExpression(state, Precedence.ATTACH - 1, stop);
  return result.ok ? { ...result, value: unparen(result.value) } : result;
}

export function parseExpression(
  state: ParseState,
  minPrec: number = Precedence.NONE,
  stopScript?: TokenType,
): ParseResult<ASTNode> {
  const first = parsePrefix(state);
  if (!first.ok) {
    return first;
  }
  let left = first.value;
  let cursor = first.state;

  // This local builder is owned by this parse invocation, never a caller's AST.
  let juxtaposed: ASTNode[] | undefined;
  const append = (right: ASTNode) => {
    if (!juxtaposed) {
      juxtaposed = left.type === "Row" ? [...left.children] : [left];
      left = { type: "Row", children: juxtaposed, start: left.start };
    }
    juxtaposed.push(right);
  };

  while (!isAtEnd(cursor)) {
    const token = peek(cursor);
    if (boundary(token) || token.type === stopScript) {
      break;
    }
    const adjacent = peek(cursor, -1).end === token.start;
    if (
      token.type === "OPERATOR" &&
      token.value === "'" &&
      adjacent &&
      minPrec < Precedence.ATTACH
    ) {
      let count = 0;
      do {
        count++;
        cursor = next(cursor);
      } while (
        peek(cursor).type === "OPERATOR" &&
        peek(cursor).value === "'" &&
        peek(cursor, -1).end === peek(cursor).start
      );
      let subscript: ASTNode | undefined;
      if (peek(cursor).type === "UNDERSCORE" && stopScript !== "UNDERSCORE") {
        const sub = parseScriptOperand(next(cursor), "CARET");
        if (!sub.ok) {
          return sub;
        }
        subscript = sub.value;
        cursor = sub.state;
      }
      left = {
        type: "Attach",
        base: left,
        superscript: { type: "Operator", operator: "′".repeat(count) },
        subscript,
        start: left.start,
        end: peek(cursor, -1).end,
      };
      juxtaposed = undefined;
      continue;
    }
    if (
      token.type === "OPERATOR" &&
      token.value === "!" &&
      adjacent &&
      minPrec < Precedence.POSTFIX
    ) {
      left = {
        type: "UnaryOp",
        operator: "!",
        argument: left,
        position: "postfix",
        start: left.start,
        end: token.end,
      };
      cursor = next(cursor);
      juxtaposed = undefined;
      continue;
    }
    if ((token.type === "CARET" || token.type === "UNDERSCORE") && minPrec < Precedence.ATTACH) {
      const result = parseAttachment(cursor, left);
      if (!result.ok) {
        return result;
      }
      left = result.value;
      cursor = result.state;
      juxtaposed = undefined;
      continue;
    }
    if (token.type === "SLASH" && minPrec < Precedence.FRAC) {
      if (boundary(peek(next(cursor)))) {
        return failure(cursor, "Expected denominator after /");
      }
      const denominator = parseExpression(next(cursor), Precedence.FRAC);
      if (!denominator.ok) {
        return denominator;
      }
      left = {
        type: "Fraction",
        numerator: unparen(left),
        denominator: unparen(denominator.value),
        start: left.start,
        end: denominator.value.end,
      };
      cursor = denominator.state;
      juxtaposed = undefined;
      continue;
    }
    const precedence = token.type === "LITERAL" ? Precedence.NONE : getBinaryPrecedence(token);
    if (precedence > minPrec) {
      const after = next(cursor);
      const op =
        token.type === "IDENT" && Object.hasOwn(SYMBOLS, token.value)
          ? SYMBOLS[token.value].unicode
          : token.value;
      if (boundary(peek(after))) {
        append({
          type: "Operator",
          operator: op,
          sourceName: token.type === "IDENT" ? token.value : undefined,
          start: token.start,
          end: token.end,
        });
        cursor = after;
        break;
      }
      const right = parseExpression(after, precedence);
      if (!right.ok) {
        return right;
      }
      left = {
        type: "BinaryOp",
        operator: op,
        sourceName: token.type === "IDENT" ? token.value : undefined,
        left,
        right: right.value,
        start: left.start,
        end: right.value.end,
      };
      cursor = right.state;
      juxtaposed = undefined;
      continue;
    }
    if (
      (token.type === "LITERAL" || !isBinaryOperator(token)) &&
      minPrec < Precedence.IMPLICIT_MUL
    ) {
      const right = parseExpression(cursor, Precedence.IMPLICIT_MUL);
      if (!right.ok) {
        return right;
      }
      append(right.value);
      cursor = right.state;
      continue;
    }
    break;
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
    if (token.type === "LINEBREAK") {
      hadLayout = true;
      flushRow();
      cursor = next(cursor);
      continue;
    }
    if (token.type === "AMPERSAND") {
      hadLayout = true;
      flushCell();
      cursor = next(cursor);
      continue;
    }
    if (closing(token) || token.type === "COMMA" || token.type === "SEMICOLON") {
      expressions.push(operator(token));
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
    expressions.push(expression.value);
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
