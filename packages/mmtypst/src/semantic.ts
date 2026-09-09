import {
  ACCENT_SYMBOLS,
  DELIMITERS,
  DELIMITER_SHORTHANDS,
  FONT_VARIANTS,
  MATH_FUNCTIONS,
  SYMBOLS,
} from "./symbols.ts";
import type { ASTNode, FunctionCallNode, TypstToMathMLOptions } from "./types.ts";

type FunctionSignature = {
  min: number;
  max?: number;
  named?: readonly string[];
};

const attachmentAliases = [
  ["t", "top"],
  ["b", "bottom"],
  ["tl", "topLeft"],
  ["tr", "topRight"],
  ["bl", "bottomLeft"],
  ["br", "bottomRight"],
] as const;

const signatures: Record<string, FunctionSignature> = {
  frac: { min: 2, max: 2 },
  sqrt: { min: 1, max: 1 },
  root: { min: 1, max: 2, named: ["n", "index"] },
  binom: { min: 2 },
  attach: {
    min: 1,
    max: 1,
    named: [
      "t",
      "b",
      "tl",
      "tr",
      "bl",
      "br",
      "top",
      "bottom",
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight",
    ],
  },
  mat: { min: 1 },
  vec: { min: 1 },
  cases: { min: 1 },
  limits: { min: 1, max: 1 },
  scripts: { min: 1, max: 1 },
  display: { min: 1, max: 1 },
  inline: { min: 1, max: 1 },
  lr: { min: 1, max: 1 },
  abs: { min: 1, max: 1 },
  norm: { min: 1, max: 1 },
  floor: { min: 1, max: 1 },
  ceil: { min: 1, max: 1 },
  round: { min: 1, max: 1 },
  "bracket.stroked": { min: 1, max: 1 },
  "bracket.double": { min: 1, max: 1 },
};

for (const name of Object.keys(ACCENT_SYMBOLS)) {
  signatures[name] = { min: 1, max: 1 };
}
for (const name of Object.keys(FONT_VARIANTS)) {
  signatures[name] = { min: 1, max: 1 };
}
for (const name of MATH_FUNCTIONS) {
  signatures[name] = { min: 0 };
}

export const FUNCTION_SIGNATURES: Readonly<Record<string, FunctionSignature>> = signatures;

export function resolveAST(node: ASTNode, options: TypstToMathMLOptions = {}): ASTNode {
  const resolveChild = (child: ASTNode) => resolveAST(child, options);

  switch (node.type) {
    case "Ident": {
      const name = sourceName(node);
      const replacement = customSymbol(node, options);
      const isUnknown =
        replacement === undefined &&
        Array.from(name).length > 1 &&
        !Object.hasOwn(SYMBOLS, name) &&
        !MATH_FUNCTIONS.has(name);

      if (options.unknownNames === "error" && isUnknown) {
        return semanticError(node, `Unknown symbol: "${name}"`);
      }

      return replacement === undefined ? node : { ...node, name: replacement };
    }

    case "Operator": {
      const replacement = customSymbol(node, options);
      return replacement === undefined ? node : { ...node, operator: replacement };
    }

    case "Space": {
      const replacement = customSymbol(node, options);
      if (replacement === undefined) {
        return node;
      }

      return {
        type: "Ident",
        name: replacement,
        sourceName: node.sourceName,
        start: node.start,
        end: node.end,
      };
    }

    case "BinaryOp":
      return {
        ...node,
        operator: customSymbol(node, options) ?? node.operator,
        left: resolveChild(node.left),
        right: resolveChild(node.right),
      };

    case "UnaryOp":
      return { ...node, argument: resolveChild(node.argument) };

    case "Fraction":
      return {
        ...node,
        numerator: resolveChild(node.numerator),
        denominator: resolveChild(node.denominator),
      };

    case "Attach":
      return {
        ...node,
        base: resolveChild(node.base),
        subscript: node.subscript && resolveChild(node.subscript),
        superscript: node.superscript && resolveChild(node.superscript),
        topLeft: node.topLeft && resolveChild(node.topLeft),
        bottomLeft: node.bottomLeft && resolveChild(node.bottomLeft),
        topRight: node.topRight && resolveChild(node.topRight),
        bottomRight: node.bottomRight && resolveChild(node.bottomRight),
      };

    case "Group":
      return { ...node, body: resolveChild(node.body) };

    case "Row":
      return { ...node, children: node.children.map(resolveChild) };

    case "Matrix": {
      if (!validDelimiter(node.delimiter)) {
        return semanticError(node, "Unsupported matrix delimiter");
      }

      const columnCount = node.rows[0]?.length ?? 0;
      const isRectangular = node.rows.every((row) => row.length === columnCount);
      if (columnCount === 0 || !isRectangular) {
        return semanticError(node, "Matrix must be nonempty and rectangular");
      }

      return { ...node, rows: node.rows.map((row) => row.map(resolveChild)) };
    }

    case "Table":
      return { ...node, rows: node.rows.map((row) => row.map(resolveChild)) };

    case "Cases":
      if (!validDelimiter(node.delimiter ?? "{")) {
        return semanticError(node, "Unsupported cases delimiter");
      }

      return {
        ...node,
        cases: node.cases.map((branch) => ({
          expression: resolveChild(branch.expression),
          condition: branch.condition ? resolveChild(branch.condition) : undefined,
        })),
      };

    case "FunctionCall":
      return resolveFunctionCall(node, options);

    default:
      return node;
  }
}

function resolveFunctionCall(node: FunctionCallNode, options: TypstToMathMLOptions): ASTNode {
  const name = sourceName(node);
  const signature = Object.hasOwn(signatures, name) ? signatures[name] : undefined;
  const args = node.args.map((argument) => resolveAST(argument, options));
  const namedArgs = resolveNamedArguments(node.namedArgs, options);

  if (!signature && options.unknownNames === "error" && Array.from(name).length > 1) {
    return semanticError(node, `Unknown function: "${name}"`);
  }

  if (signature) {
    const tooFew = args.length < signature.min;
    const tooMany = signature.max !== undefined && args.length > signature.max;
    if (tooFew || tooMany) {
      return semanticError(node, `Invalid arguments for ${name}`);
    }
  }

  const allowedNames = signature?.named ?? [];
  if (namedArgs && Object.keys(namedArgs).some((argument) => !allowedNames.includes(argument))) {
    return semanticError(node, `Unknown named argument for ${name}`);
  }

  if (name === "root") {
    const hasNamedIndex = namedArgs?.n !== undefined || namedArgs?.index !== undefined;
    const hasBothAliases = namedArgs?.n !== undefined && namedArgs.index !== undefined;
    if (hasBothAliases || (args.length > 1 && hasNamedIndex)) {
      return semanticError(node, "Conflicting root index arguments");
    }
  }

  if (name === "attach" && namedArgs) {
    for (const [short, long] of attachmentAliases) {
      if (namedArgs[short] !== undefined && namedArgs[long] !== undefined) {
        return semanticError(node, `Conflicting attachment arguments: ${short}, ${long}`);
      }
    }
  }

  return { ...node, args, namedArgs };
}

function resolveNamedArguments(
  namedArgs: FunctionCallNode["namedArgs"],
  options: TypstToMathMLOptions,
): FunctionCallNode["namedArgs"] {
  if (!namedArgs) {
    return undefined;
  }

  const entries = Object.entries(namedArgs).map(([name, value]) => [
    name,
    typeof value === "string" ? value : resolveAST(value, options),
  ]);
  return Object.fromEntries(entries);
}

function semanticError(node: ASTNode, message: string): ASTNode {
  return { type: "Error", message, start: node.start, end: node.end };
}

type NamedNode = { sourceName?: string; name?: string; operator?: string };

function sourceName(node: NamedNode): string {
  return node.sourceName ?? node.name ?? node.operator ?? "";
}

function customSymbol(node: NamedNode, options: TypstToMathMLOptions): string | undefined {
  const name = sourceName(node);
  if (Object.prototype.hasOwnProperty.call(options.symbols ?? {}, name)) {
    return options.symbols?.[name];
  }
  return undefined;
}

function validDelimiter(delimiter: string): boolean {
  if (delimiter === "none") {
    return true;
  }

  const canonical = Object.hasOwn(DELIMITER_SHORTHANDS, delimiter)
    ? DELIMITER_SHORTHANDS[delimiter]
    : delimiter;
  return Object.hasOwn(DELIMITERS, canonical) && DELIMITERS[canonical].class !== "close";
}
