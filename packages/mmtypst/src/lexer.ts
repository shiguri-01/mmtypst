/**
 * Lexer for Typst math expressions.
 *
 * Implements a clean, stateful scanner with explicit position transitions.
 */

import {
  isClosingDelimiter,
  isOpeningDelimiter,
  SHORTHANDS,
  type ShorthandDef,
} from "./symbols.ts";
import type { Token } from "./types.ts";

/**
 * Tokenizes a Typst math expression string into a sequence of tokens.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const len = input.length;
  let pos = 0;

  while (pos < len) {
    // 1. Skip whitespace and comments
    const nextNonWhitespace = skipWhitespaceAndComments(input, pos, len);
    if (nextNonWhitespace !== pos) {
      pos = nextNonWhitespace;
      continue;
    }

    if (pos >= len) break;

    const start = pos;
    const ch = String.fromCodePoint(input.codePointAt(pos)!);

    // A backslash before whitespace (or EOF) is a line break; otherwise it
    // escapes a character. Escapes must not be reinterpreted as syntax.
    if (ch === "\\") {
      if (pos + 1 === len || /\s/u.test(input[pos + 1])) {
        tokens.push({ type: "LINEBREAK", value: "\\", start, end: ++pos });
      } else {
        const escaped = scanEscape(input, pos);
        pos = escaped.end;
        tokens.push({ type: "LITERAL", value: escaped.value, start, end: pos });
      }
      continue;
    }

    // 4. Shorthands (multi- and single-character, longest prefix match)
    const shorthand = matchShorthand(input, pos);
    if (shorthand) {
      tokens.push({
        type: shorthand.type,
        value: shorthand.replacement,
        start,
        end: pos + shorthand.pattern.length,
      });
      pos += shorthand.pattern.length;
      continue;
    }

    // 5. Numbers (integers, decimals, and leading dot .5)
    if (isDigit(ch) || (ch === "." && pos + 1 < len && isDigit(input[pos + 1]))) {
      const numStr = scanNumber(input, pos, len);
      pos += numStr.length;
      tokens.push({ type: "NUMBER", value: numStr, start, end: pos });
      continue;
    }

    // 6. String literals
    if (ch === '"') {
      const { str, endPos } = scanString(input, pos, len);
      pos = endPos;
      tokens.push({ type: "STRING", value: str, start, end: pos });
      continue;
    }

    // 7. Identifiers (e.g. x, alpha, phi.alt, plus.minus)
    if (isIdentStart(ch)) {
      const ident = scanIdentifier(input, pos, len);
      pos += ident.length;
      tokens.push({ type: "IDENT", value: ident, start, end: pos });
      continue;
    }

    // 8. Fixed syntactic punctuation
    const fixedType = FIXED_TYPES[ch];
    if (fixedType) {
      tokens.push({ type: fixedType, value: ch, start, end: pos + 1 });
      pos++;
      continue;
    }

    // 9. Delimiters (brackets, braces, angle, floor, ceil, double brackets)
    if (isOpeningDelimiter(ch)) {
      tokens.push({ type: "OPEN_DELIM", value: ch, start, end: pos + 1 });
      pos++;
      continue;
    }
    if (isClosingDelimiter(ch)) {
      tokens.push({ type: "CLOSE_DELIM", value: ch, start, end: pos + 1 });
      pos++;
      continue;
    }

    // 10. General operators and single characters
    tokens.push({ type: "OPERATOR", value: ch, start, end: pos + ch.length });
    pos += ch.length;
  }

  tokens.push({ type: "EOF", value: "", start: pos, end: pos });
  return tokens;
}

const FIXED_TYPES: Readonly<Record<string, Token["type"]>> = {
  "(": "LPAREN",
  ")": "RPAREN",
  _: "UNDERSCORE",
  "^": "CARET",
  "&": "AMPERSAND",
  "/": "SLASH",
  ",": "COMMA",
  ";": "SEMICOLON",
  ":": "COLON",
};

function skipWhitespaceAndComments(input: string, start: number, len: number): number {
  let pos = start;
  while (pos < len) {
    const ch = input[pos];
    // Typst math treats ordinary newlines as whitespace. Explicit line breaks
    // are represented by a backslash token and are handled below.
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      pos++;
      continue;
    }
    // Single-line comment: // ... \n
    if (ch === "/" && pos + 1 < len && input[pos + 1] === "/") {
      pos += 2;
      while (pos < len && input[pos] !== "\n") {
        pos++;
      }
      continue;
    }
    // Nested block comments: /* ... /* ... */ ... */
    if (ch === "/" && pos + 1 < len && input[pos + 1] === "*") {
      const commentStart = pos;
      pos += 2;
      let depth = 1;
      while (pos < len && depth > 0) {
        if (input[pos] === "/" && pos + 1 < len && input[pos + 1] === "*") {
          depth++;
          pos += 2;
        } else if (input[pos] === "*" && pos + 1 < len && input[pos + 1] === "/") {
          depth--;
          pos += 2;
        } else {
          pos++;
        }
      }
      if (depth > 0) {
        throw new SyntaxError(`Unterminated comment at offset ${commentStart}`);
      }
      continue;
    }
    break;
  }
  return pos;
}

function matchShorthand(input: string, pos: number): ShorthandDef | null {
  return SHORTHANDS.find((entry) => input.startsWith(entry.pattern, pos)) ?? null;
}

function isDigit(ch?: string): boolean {
  return ch !== undefined && ch >= "0" && ch <= "9";
}

function isIdentStart(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || (ch > "\u007F" && /\p{L}/u.test(ch))
  );
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

function scanNumber(input: string, start: number, len: number): string {
  let pos = start;
  let hasDot = false;

  while (pos < len) {
    const ch = input[pos];
    if (isDigit(ch)) {
      pos++;
    } else if (ch === "." && !hasDot && pos + 1 < len && isDigit(input[pos + 1])) {
      hasDot = true;
      pos++;
    } else {
      break;
    }
  }

  return input.slice(start, pos);
}

function scanString(input: string, start: number, len: number): { str: string; endPos: number } {
  let pos = start + 1; // skip opening quote
  let result = "";

  while (pos < len) {
    const ch = input[pos];
    if (ch === '"') {
      return { str: result, endPos: pos + 1 };
    }
    if (ch === "\\" && pos + 1 < len) {
      const escaped = scanEscape(input, pos, true);
      result += escaped.value;
      pos = escaped.end;
    } else {
      result += ch;
      pos++;
    }
  }

  throw new SyntaxError(`Unterminated string at offset ${start}`);
}

function scanEscape(
  input: string,
  start: number,
  inString = false,
): { value: string; end: number } {
  const next = String.fromCodePoint(input.codePointAt(start + 1)!);
  if (next === "u" && input[start + 2] === "{") {
    const close = input.indexOf("}", start + 3);
    const hex = close < 0 ? "" : input.slice(start + 3, close);
    const code = Number.parseInt(hex, 16);
    if (!/^[0-9a-fA-F]{1,6}$/.test(hex) || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      throw new SyntaxError(`Invalid Unicode escape at offset ${start}`);
    }
    return { value: String.fromCodePoint(code), end: close + 1 };
  }
  if (inString && (next === "n" || next === "t" || next === "r")) {
    return { value: next === "n" ? "\n" : next === "t" ? "\t" : "\r", end: start + 2 };
  }
  if (/[\p{L}\p{N}]/u.test(next)) throw new SyntaxError(`Invalid escape at offset ${start}`);
  return { value: next, end: start + 1 + next.length };
}

function scanIdentifier(input: string, start: number, len: number): string {
  let pos = start;

  while (pos < len) {
    const ch = String.fromCodePoint(input.codePointAt(pos)!);
    if (isIdentPart(ch)) {
      pos += ch.length;
    } else if (ch === "." && pos + 1 < len && isIdentStart(input[pos + 1])) {
      // Dotted symbol extension: phi.alt, plus.minus, etc.
      pos += 2;
      while (pos < len && isIdentPart(input[pos])) {
        pos++;
      }
    } else {
      break;
    }
  }

  return input.slice(start, pos);
}
