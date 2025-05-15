/**
 * @fileoverview Vite configuration file for the project.
 * This configuration sets up the development server (host, port),
 * includes the React plugin (@vitejs/plugin-react-swc),
 * and defines path aliases (e.g., "@" for "./src").
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
