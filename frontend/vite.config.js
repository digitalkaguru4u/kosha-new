import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API runs on :5000 and Vite proxies to it, so cookies stay same-origin.
const API = process.env.VITE_DEV_API || 'http://localhost:5000';
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': API, '/uploads': API, '/sitemap.xml': API, '/robots.txt': API } },
  preview: { port: 4173, proxy: { '/api': API, '/uploads': API, '/sitemap.xml': API, '/robots.txt': API } },
  build: { sourcemap: false, chunkSizeWarningLimit: 700 }
});
