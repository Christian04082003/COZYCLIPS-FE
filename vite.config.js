import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      // Proxy /api requests to the backend
      '/api': {
        target: 'https://czc-2v1vy26v5-gerard-francis-v-pelonios-projects.vercel.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        headers: {
          // Ensure Authorization header is forwarded
          'Authorization': undefined
        }
      }
    }
  }
})
