import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  preview: {
    allowedHosts: ["serene-charisma-production-5e91.up.railway.app"]
  }
});