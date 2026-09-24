import solid from "unplugin-solid/rolldown";
import viteSolid from "vite-plugin-solid";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [viteSolid()],
  pack: [
    {
      name: "browser",
      entry: ["src/index.tsx"],
      outDir: "dist/browser",
      platform: "neutral",
      plugins: [solid({ solid: { hydratable: true } })],
      dts: { generator: "tsgo" },
      exports: false,
    },
    {
      name: "server",
      entry: ["src/index.tsx"],
      outDir: "dist/server",
      platform: "neutral",
      plugins: [solid({ ssr: true })],
      dts: { generator: "tsgo" },
      exports: false,
    },
  ],
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
