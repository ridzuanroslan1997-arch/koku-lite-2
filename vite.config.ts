import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env vars. If process.cwd fails in some environments, default to '.'
  // Cast process to any to avoid TypeScript error if Node types are missing
  const cwd = (process as any).cwd ? (process as any).cwd() : '.';
  const env = loadEnv(mode, cwd, '');

  return {
    plugins: [react()],
    define: {
      // Jika API_KEY tiada, kita letak string kosong "" supaya app tak crash (Blank Screen)
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
      'process.env': {},
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});