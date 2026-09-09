import { generateMathML } from "./generator.ts";
import { tokenize } from "./lexer.ts";
import { parse } from "./parser.ts";
import type { TypstToMathMLOptions } from "./types.ts";

export * from "./types.ts";
export { tokenize } from "./lexer.ts";
export { parse } from "./parser.ts";
export { generateMathML } from "./generator.ts";

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
