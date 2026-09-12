import { generateMathML } from "./generator.ts";
import { tokenize } from "./lexer.ts";
import { parse } from "./parser.ts";
import type { TypstToMathMLOptions } from "./types.ts";

export * from "./types.ts";
export { tokenize } from "./lexer.ts";
export { parse } from "./parser.ts";
export { generateMathML } from "./generator.ts";

/**
 * Extracts a `$`-delimited Typst equation and its display mode.
 *
 * Whitespace around the whole input and inside the delimiters is removed from
 * the returned body. Whitespace immediately inside both delimiters denotes a
 * block equation in Typst.
 */
export function extractTypstMath(input: string): { body: string; display: "inline" | "block" } {
  const source = input.trim();
  if (source.length < 2 || source[0] !== "$" || source.at(-1) !== "$") {
    throw new RangeError("Expected a $...$ Typst math expression");
  }

  const inner = source.slice(1, -1);
  return {
    body: inner.trim(),
    display: /^\s/.test(inner) && /\s$/.test(inner) ? "block" : "inline",
  };
}

/**
 * Parses Typst math syntax and converts it to a clean MathML string.
 *
 * Supports both browser and server-side environments with zero dependencies.
 *
 * @param input Typst math expression string (e.g. "x = (-b plus.minus sqrt(b^2 - 4 a c)) / (2 a)").
 * @param options Conversion options.
 * @returns MathML string.
 */
export function typstToMathML(input: string, options: TypstToMathMLOptions = {}): string {
  try {
    const tokens = tokenize(input);
    const ast = parse(tokens);
    return generateMathML(ast, options);
  } catch (error: unknown) {
    if (options.throwOnError) {
      throw error;
    }
    return generateMathML(
      { type: "Error", message: error instanceof Error ? error.message : String(error) },
      options,
    );
  }
}
