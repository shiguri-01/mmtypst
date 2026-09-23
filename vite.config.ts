import { defineConfig } from "vite-plus";

import { generatedFixtures } from "./packages/mmtypst/vite.config.ts";

const ignoredFixtures = generatedFixtures.map((pattern) => `packages/mmtypst/${pattern}`);

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ignoredFixtures,
    sortImports: true,
  },
  lint: {
    ignorePatterns: ignoredFixtures,
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: {
      tasks: true,
      scripts: false,
    },
  },
});
