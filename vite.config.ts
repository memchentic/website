import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages project site defaults to /website/; container/homelab builds
  // pass VITE_BASE=/ for a custom-domain root.
  base: process.env.VITE_BASE ?? "/website/",
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
});
