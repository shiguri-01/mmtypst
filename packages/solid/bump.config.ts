import { defineConfig } from "bumpp";

export default defineConfig({
  files: ["package.json"],
  commit: "release: @mmtypst/solid v%s",
  tag: "@mmtypst/solid@%s",
});
