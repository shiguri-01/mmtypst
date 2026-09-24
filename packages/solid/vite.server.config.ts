import viteSolid from "vite-plugin-solid";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [viteSolid({ hot: false, ssr: true })],
  test: {
    include: ["tests/server.test.tsx"],
    environment: "node",
  },
});
