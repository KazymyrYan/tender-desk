import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Обхід CORS: запити з браузера йдуть на /api/prozorro → публічне API Прозорро
      '/api/prozorro': {
        target: 'https://public-api.prozorro.gov.ua',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/prozorro/, '/api/2.5'),
        secure: true,
      },
    },
  },
})
