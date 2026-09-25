import { fileURLToPath } from "node:url";

import solid from "@astrojs/solid-js";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [solid()],
  vite: {
    resolve: {
      alias: {
        mmtypst: fileURLToPath(new URL("../../packages/mmtypst/src/index.ts", import.meta.url)),
      },
    },
  },
});
