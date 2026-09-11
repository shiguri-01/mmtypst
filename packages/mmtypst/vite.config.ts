import { defineConfig } from "vite-plus";

export const generatedFixtures = ["tests/fixtures/**/*.json"];

export default defineConfig({
  run: {
    tasks: {
      "update-typst-conformance": {
        command: "node scripts/update-typst-conformance.ts",
        cache: false,
      },
    },
  },
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    ignorePatterns: generatedFixtures,
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: generatedFixtures,
  },
});
