import { generateMathML, generateMathMLBody } from "./generator.ts";
import { tokenize } from "./lexer.ts";
import { parse } from "./parser.ts";
import type { ASTNode, RenderMathMLBodyOptions, RenderMathMLOptions } from "./types.ts";

export * from "./types.ts";
export { tokenize } from "./lexer.ts";
export { parse } from "./parser.ts";
export { generateMathML, generateMathMLBody } from "./generator.ts";

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
export function renderMathML(input: string, options: RenderMathMLOptions = {}): string {
  return convert(input, options, (ast) => generateMathML(ast, options));
}

/** Converts Typst math syntax to content for a caller-provided `<math>` element. */
export function renderMathMLBody(input: string, options: RenderMathMLBodyOptions = {}): string {
  return convert(input, options, (ast) => generateMathMLBody(ast, options));
}

function convert(
  input: string,
  options: RenderMathMLBodyOptions,
  generate: (ast: ASTNode) => string,
): string {
  try {
    const tokens = tokenize(input);
    const ast = parse(tokens);
    return generate(ast);
  } catch (error: unknown) {
    if (options.throwOnError) {
      throw error;
    }
    return generate({
      type: "Error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
