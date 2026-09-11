import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      "update-typst-fixtures": {
        command: "node scripts/update-typst-fixtures.ts && vp fmt tests/fixtures/typst.json",
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
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
