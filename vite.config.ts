import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://<user>.github.io/habitkeeper/
export default defineConfig({
  base: "/habitkeeper/",
  plugins: [react()],
});
