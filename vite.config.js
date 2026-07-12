import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In local dev the app runs on 5173 and the API on 3000. This proxy lets the
    // frontend call a relative "/api" path (same as production) without CORS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
