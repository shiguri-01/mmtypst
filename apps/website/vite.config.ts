import { fileURLToPath } from "node:url";

import solid from "vite-plugin-solid";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      mmtypst: fileURLToPath(new URL("../../packages/mmtypst/src/index.ts", import.meta.url)),
    },
  },
});
