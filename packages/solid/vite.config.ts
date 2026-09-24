import babel from "@rolldown/plugin-babel";
import solid from "vite-plugin-solid";
import { defineConfig } from "vite-plus";

function solidBabel(generate: "dom" | "ssr") {
  return babel({
    presets: [
      ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
      ["babel-preset-solid", { generate, hydratable: true }],
    ],
  });
}

export default defineConfig({
  plugins: [solid()],
  pack: [
    {
      name: "browser",
      entry: ["src/index.tsx"],
      outDir: "dist/browser",
      plugins: [solidBabel("dom")],
      dts: { generator: "tsgo" },
      exports: false,
    },
    {
      name: "server",
      entry: ["src/index.tsx"],
      outDir: "dist/server",
      plugins: [solidBabel("ssr")],
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
