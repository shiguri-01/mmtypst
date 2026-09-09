import { describe, expect, test } from "vite-plus/test";

import { typstToMathML } from "../../src/index.ts";

describe("alignment conversion", () => {
  test("converts linebreaks and alignment markers into aligned mtable in inline mode by default", () => {
    const aligned = typstToMathML(`
      f(x) &= x + 1 \\
           &= 2
    `);
    expect(aligned).toContain('<mtable class="aligned">');
    expect(aligned).toContain("<mtr>");
    expect(aligned).toContain('display="inline"');
  });

  test("aligned tables permit rows with different column counts", () => {
    const output = typstToMathML("a &= b \\ c");
    expect(output).not.toContain("<merror>");
    expect(output).toContain('style="text-align: right"');
    expect(output).toContain('style="text-align: left"');
  });

  test.each(["a\nb", '"a & b"', '"a\\\\b"', "a /* & */ b"])(
    "non-layout syntax stays inline without a table: %s",
    (source) => {
      expect(typstToMathML(source)).toContain('display="inline"');
      expect(typstToMathML(source)).not.toContain("<mtable");
    },
  );
});
