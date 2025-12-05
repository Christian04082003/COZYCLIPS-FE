import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Determine backend target for dev proxy. Prefer VITE_BACKEND (set in .env),
// otherwise default to localhost:4000 which is common for local APIs.
const DEFAULT_BACKEND = process.env.VITE_BACKEND || process.env.BACKEND || 'http://localhost:4000';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      // Proxy /api requests to the backend during development to avoid Vite
      // serving index.html for API paths.
      '/api': {
        target: DEFAULT_BACKEND,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
}))
