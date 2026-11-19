import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    /**
     * Proxies the API to the backend during development.
     *
     * Why a proxy rather than pointing the client straight at :4000 - the
     * browser then sees every request as same-origin, so CORS never applies
     * in development and `localStorage` stays on one origin. The backend DOES
     * allow http://localhost:5173 (see its .env.example CORS_ORIGINS), so a
     * direct call also works; set VITE_API_URL in `.env.local` to do that.
     *
     * `apiClient` falls back to the relative `/api/v1` when VITE_API_URL is
     * unset, which is what this proxy serves.
     *
     * The target port must match the backend's PORT (default 4000).
     */
    proxy: {
      '/api': {
        // Override with BACKEND_ORIGIN when the backend is not on 4000, e.g.
        //   BACKEND_ORIGIN=http://localhost:4200 npm run dev
        // This is a Vite config file, so it runs in Node and reads
        // process.env directly - it is NOT a VITE_ variable and is never
        // inlined into the browser bundle.
        target: process.env['BACKEND_ORIGIN'] ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
