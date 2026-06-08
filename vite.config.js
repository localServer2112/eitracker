/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://api.mapbox.com https://*.mapbox.com; connect-src 'self' https://api.mapbox.com https://*.mapbox.com https://nominatim.openstreetmap.org http://165.227.226.100 http://157.245.35.148; worker-src blob:; font-src 'self' data:;"
    },
    proxy: {
      '/api': {
        target: 'http://165.227.226.100',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('accept-encoding', 'identity');
          });
        }
      },
      '/freezer-api': {
        target: 'http://157.245.35.148',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/freezer-api/, '/api'),
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
  }
})
