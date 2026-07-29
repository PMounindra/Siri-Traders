import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://www.siritrader.com',
        changeOrigin: true,
        xfwd: true,
        secure: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@clerk')) return 'clerk';
            if (id.includes('react-router')) return 'router';
            if (id.includes('react')) return 'vendor';
          }
        }
      }
    }
  }
})
