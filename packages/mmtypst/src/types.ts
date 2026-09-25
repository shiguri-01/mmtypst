/**
 * Options for renderMathML conversion.
 */
export interface RenderMathMLOptions {
  /**
   * Display mode:
   * - "inline" (default): `<math display="inline">`
   * - "block": `<math display="block">`
   */
  display?: "inline" | "block";

  /**
   * Whether to throw an error on syntax errors.
   * If false (default), returns a MathML `<merror>` element showing the error message.
   */
  throwOnError?: boolean;

  /**
   * Custom CSS class name to attach to the `<math>` root element.
   */
  class?: string;

  /**
   * Extra HTML/XML attributes to attach to the `<math>` root element.
   */
  attributes?: Record<string, string>;

  /**
   * Custom symbol mapping to override or extend built-in symbols.
   */
  symbols?: Record<string, string>;
}

/** Options for MathML content rendered inside a caller-provided `<math>` element. */
export type RenderMathMLBodyOptions = Pick<
  RenderMathMLOptions,
  "display" | "throwOnError" | "symbols"
>;

/**
 * Token types emitted by the lexer.
 */
export type TokenType =
  | "NUMBER"
  | "STRING"
  | "LITERAL" // Escaped character: never interpreted as syntax or a symbol name.
  | "ATOM" // A single math grapheme, distinct from a named identifier.
  | "IDENT"
  | "OPERATOR"
  | "LPAREN" // (
  | "RPAREN" // )
  | "OPEN_DELIM" // [, {, ⟦, ⟨, ⌊, ⌈, etc.
  | "CLOSE_DELIM" // ], }, ⟧, ⟩, ⌋, ⌉, etc.
  | "LBRACKET" // [ (compatibility alias)
  | "RBRACKET" // ] (compatibility alias)
  | "LBRACE" // { (compatibility alias)
  | "RBRACE" // } (compatibility alias)
  | "UNDERSCORE" // _
  | "CARET" // ^
  | "AMPERSAND" // &
  | "SLASH" // /
  | "PRIMES" // One or more adjacent apostrophes.
  | "ROOT" // √, ∛, ∜
  | "COMMA" // ,
  | "SEMICOLON" // ;
  | "COLON" // :
  | "LINEBREAK" // \ followed by whitespace or end of input
  | "NEWLINE" // \n
  | "EOF";

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Structured parse error.
 */
export type ParseError =
  | {
      readonly type: "UnexpectedToken";
      readonly expected: readonly string[];
      readonly actual?: Token;
      readonly position: number;
    }
  | {
      readonly type: "UnexpectedEOF";
      readonly position: number;
    }
  | {
      readonly type: "MismatchedDelimiter";
      readonly expected: string;
      readonly actual: string;
      readonly position: number;
    }
  | {
      readonly type: "CustomError";
      readonly message: string;
      readonly position: number;
    };

/**
 * A branch in a cases expression: an expression and an optional condition.
 */
export interface CaseBranch {
  readonly expression: ASTNode;
  readonly condition?: ASTNode;
}

/**
 * AST Node definitions.
 *
 * NOTE: The AST contains only semantically meaningful nodes.
 * Top-level layout markers become structural rows and cells. A marker used
 * as a fraction/script operand remains an empty layout atom, as in Typst.
 */
export type ASTNode =
  | NumberNode
  | IdentNode
  | StringNode
  | OperatorNode
  | BinaryOpNode
  | UnaryOpNode
  | FractionNode
  | AttachNode
  | FunctionCallNode
  | GroupNode
  | MatrixNode
  | CasesNode
  | RowNode
  | TableNode
  | LayoutMarkerNode
  | SpaceNode
  | ErrorNode;

export interface BaseNode {
  readonly type: string;
  /** Original symbol spelling, retained until semantic resolution. */
  readonly sourceName?: string;
  readonly start?: number;
  readonly end?: number;
}

export interface LayoutMarkerNode extends BaseNode {
  readonly type: "LayoutMarker";
  readonly kind: "alignment" | "linebreak";
}

export interface NumberNode extends BaseNode {
  readonly type: "Number";
  readonly value: string;
}

export interface IdentNode extends BaseNode {
  readonly type: "Ident";
  readonly name: string;
  readonly mathvariant?: string;
  readonly isUnknown?: boolean;
}

export interface StringNode extends BaseNode {
  readonly type: "String";
  readonly value: string;
}

export interface OperatorNode extends BaseNode {
  readonly type: "Operator";
  readonly operator: string;
  readonly stretchy?: boolean;
}

export interface BinaryOpNode extends BaseNode {
  readonly type: "BinaryOp";
  readonly operator: string;
  readonly left: ASTNode;
  readonly right: ASTNode;
}

export interface UnaryOpNode extends BaseNode {
  readonly type: "UnaryOp";
  readonly operator: string;
  readonly argument: ASTNode;
  readonly position: "prefix" | "postfix";
}

export interface FractionNode extends BaseNode {
  readonly type: "Fraction";
  readonly numerator: ASTNode;
  readonly denominator: ASTNode;
}

export interface AttachNode extends BaseNode {
  readonly type: "Attach";
  readonly base: ASTNode;
  /** Prime shorthand attaches on the right, even for bases with limits. */
  readonly primes?: number;
  readonly subscript?: ASTNode;
  readonly superscript?: ASTNode;
  // For multiscripts:
  readonly topLeft?: ASTNode;
  readonly bottomLeft?: ASTNode;
  readonly topRight?: ASTNode;
  readonly bottomRight?: ASTNode;
  readonly isLimits?: boolean;
}

export interface FunctionCallNode extends BaseNode {
  readonly type: "FunctionCall";
  readonly name: string;
  readonly args: readonly ASTNode[];
  readonly namedArgs?: Readonly<Record<string, ASTNode | string>>;
}

export interface GroupNode extends BaseNode {
  readonly type: "Group";
  readonly open: string;
  readonly close: string;
  readonly body: ASTNode;
  readonly isFence?: boolean;
}

export interface MatrixNode extends BaseNode {
  readonly type: "Matrix";
  readonly delimiter: string; // Opening or neutral delimiter character.
  readonly rows: ReadonlyArray<readonly ASTNode[]>;
}

export interface CasesNode extends BaseNode {
  readonly type: "Cases";
  readonly cases: readonly CaseBranch[];
  readonly delimiter?: string;
}

export interface RowNode extends BaseNode {
  readonly type: "Row";
  readonly children: readonly ASTNode[];
}

export interface TableNode extends BaseNode {
  readonly type: "Table";
  readonly rows: ReadonlyArray<readonly ASTNode[]>;
  readonly className?: string;
}

export interface SpaceNode extends BaseNode {
  readonly type: "Space";
  readonly width: string; // e.g. "0.1667em", "1em", etc.
}

export interface ErrorNode extends BaseNode {
  readonly type: "Error";
  readonly message: string;
  readonly raw?: string;
  readonly diagnostic?: ParseError;
}
