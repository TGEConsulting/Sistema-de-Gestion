import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    // Sin esto, Vite solo escucha en IPv6 (::1) en algunos entornos Windows,
    // y el navegador no conecta si intenta primero 127.0.0.1 (IPv4).
    host: true,
  },
});
