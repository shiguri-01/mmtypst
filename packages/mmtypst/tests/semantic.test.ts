import { describe, expect, test } from "vite-plus/test";

import { resolveAST } from "../src/semantic.ts";
import type { ASTNode } from "../src/types.ts";

const call = (name: string, args: ASTNode[] = [], namedArgs?: Record<string, ASTNode>) =>
  ({ type: "FunctionCall", name, args, namedArgs }) as ASTNode;
const x = { type: "Ident", name: "x" } as ASTNode;

describe("semantic resolution", () => {
  test("rejects unknown identifiers and calls when unknownNames is error", () => {
    expect(
      resolveAST({ type: "Ident", name: "foobar" } as ASTNode, { unknownNames: "error" }).type,
    ).toBe("Error");
    expect(resolveAST(call("foobar", [x]), { unknownNames: "error" }).type).toBe("Error");
    expect(resolveAST(call("f", [x]), { unknownNames: "error" }).type).toBe("FunctionCall");
  });
  test("validates arity and named arguments", () => {
    expect(resolveAST(call("sqrt"), {}).type).toBe("Error");
    expect(resolveAST(call("sqrt", [x], { nope: x }), {}).type).toBe("Error");
    expect(resolveAST(call("binom", [x, x], { tl: x, br: x }), {}).type).toBe("Error");
  });
  test("allows custom symbols while retaining AST shape", () => {
    const node = { type: "Ident", name: "thetaPrime" } as ASTNode;
    expect(resolveAST(node, { unknownNames: "error", symbols: { thetaPrime: "θ" } })).toEqual({
      type: "Ident",
      name: "θ",
    });
  });
});
