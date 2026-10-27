import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite-plus";

// Astro builds the site first; Vite packages its output for Cloudflare.
export default defineConfig({
  plugins: [cloudflare()],
  publicDir: "dist",
});
