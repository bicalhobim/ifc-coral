import {execFileSync} from 'node:child_process';
import packageInfo from './package.json';
import { defineConfig } from "vite";
import {localWorkspacePlugin} from './server/workspace.mjs';

let commit:string|null=null,working_tree_dirty:boolean|null=null;try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();working_tree_dirty=!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();}catch{/* Build metadata remains explicitly unknown outside a Git checkout. */}

// web-ifc traz .wasm; excluir do pre-bundle evita erro de otimização.
export default defineConfig({
  plugins: [localWorkspacePlugin()],
  define:{__CORAL_BUILD__:JSON.stringify({version:packageInfo.version,commit,working_tree_dirty})},
  cacheDir: '.cache/vite',
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  optimizeDeps: { exclude: ["web-ifc"] },
  // top-level await no main.ts + wasm exigem alvo moderno.
  build: { target: "esnext" },
  esbuild: { target: "esnext" },
});
