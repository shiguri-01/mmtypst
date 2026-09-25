import { defineConfig } from "bumpp";

export default defineConfig({
  files: ["package.json"],
  commit: "release: @mmtypst/react v%s",
  tag: "react-v%s",
});
