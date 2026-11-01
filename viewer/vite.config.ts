import { defineConfig } from "vite";
import {localWorkspacePlugin} from './server/workspace.mjs';

// web-ifc traz .wasm; excluir do pre-bundle evita erro de otimização.
export default defineConfig({
  plugins: [localWorkspacePlugin()],
  cacheDir: '.cache/vite',
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  optimizeDeps: { exclude: ["web-ifc"] },
  // top-level await no main.ts + wasm exigem alvo moderno.
  build: { target: "esnext" },
  esbuild: { target: "esnext" },
});
