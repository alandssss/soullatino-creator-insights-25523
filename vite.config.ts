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
    alias: [
      { find: /^@radix-ui\/react-tooltip(?:\/.*)?$/, replacement: path.resolve(__dirname, "./src/shims/radix-tooltip-stub.tsx") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
    dedupe: [
      'react',
      'react-dom',
      'next-themes',
      'sonner',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query'],
    exclude: ['@radix-ui/react-tooltip'],
    force: true,
    cacheDir: 'node_modules/.vite-radixfix',
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
}));
