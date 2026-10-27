import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "mmtypst",
    compatibilityDate: "2026-09-18",
    assets: {
      notFoundHandling: "404-page",
    },
  },
});
