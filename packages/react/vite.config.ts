import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: {
      generator: "tsgo",
    },
    exports: true,
  },
  lint: {
    plugins: ["react"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
