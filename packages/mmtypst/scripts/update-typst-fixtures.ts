import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

import { invalidSources, sources, typstTree } from "../tests/typst-reference.ts";

// Wrap complete equations so Typst diagnoses unclosed comments as well. Newlines
// keep a trailing line comment from consuming the closing math delimiter.
// The executable/version is supplied by mise via PATH.
function evaluate(sources: string[]) {
  const result = spawnSync("typst", ["eval", "query(metadata).map(it => it.value)", "--in", "-"], {
    input: sources.map((source) => `#metadata($\n${source}\n$)`).join("\n"),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 30000,
  });
  if (result.error) throw result.error;
  return result;
}

const result = evaluate(sources);
assert.equal(result.status, 0, result.stderr);
const expected = JSON.parse(result.stdout) as unknown[];
assert.equal(expected.length, sources.length);
const valid = sources.map((source, i) => [source, typstTree(expected[i])]);

for (const source of invalidSources) {
  const result = evaluate([source]);
  assert.equal(
    result.status,
    1,
    `Expected Typst to reject ${JSON.stringify(source)}: ${result.stderr}`,
  );
  assert.match(result.stderr, /error:/);
}

const version = spawnSync("typst", ["--version"], { encoding: "utf8" });
if (version.error) throw version.error;
assert.equal(version.status, 0, version.stderr);

const fixture = { typst: version.stdout.trim(), valid, invalid: invalidSources };
const directory = new URL("../tests/fixtures/", import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL("typst.json", directory), JSON.stringify(fixture, null, 2) + "\n");
console.info(`Generated ${valid.length + invalidSources.length} cases with ${fixture.typst}`);
