import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://culture-circle-vibes-hub.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  plugins: [
    react(),
    // componentTagger removed
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
