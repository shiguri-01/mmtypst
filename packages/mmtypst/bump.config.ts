import { defineConfig } from "bumpp";

export default defineConfig({
  files: ["package.json"],
  commit: "release: mmtypst v%s",
  tag: "mmtypst@%s",
});
