import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    middlewareMode: false,
    fs: {
      allow: ["."],
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "spa-fallback",
      configureServer(server) {
        return () => {
          server.middlewares.use((req, res, next) => {
            // Skip if it's a file request or API call
            if (req.url?.includes(".") || req.url?.startsWith("/api")) {
              next();
              return;
            }
            // Serve index.html for all other routes (SPA fallback)
            req.url = "/index.html";
            next();
          });
        };
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  preview: {
    port: 8080,
  },
}));
