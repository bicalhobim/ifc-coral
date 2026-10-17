import { defineConfig } from "vite";

// web-ifc traz .wasm; excluir do pre-bundle evita erro de otimização.
export default defineConfig({
  cacheDir: '.cache/vite',
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  optimizeDeps: { exclude: ["web-ifc"] },
  // top-level await no main.ts + wasm exigem alvo moderno.
  build: { target: "esnext" },
  esbuild: { target: "esnext" },
});
