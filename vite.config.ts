import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  clearScreen: false,
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@radix-ui/react-tooltip": path.resolve(__dirname, "./src/shims/radix-tooltip-stub.tsx"),
    },
    dedupe: [
      'react',
      'react-dom',
      'next-themes',
      'sonner',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-dropdown-menu',
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query'],
    exclude: ['@radix-ui/react-tooltip'],
    force: mode === 'development',
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
}));
