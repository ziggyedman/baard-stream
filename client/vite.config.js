import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In dev, forward all /api and /auth calls to the Express server
      '/api':  { target: 'http://localhost:3001', changeOrigin: true, credentials: true },
      '/auth': { target: 'http://localhost:3001', changeOrigin: true, credentials: true },
    },
  },
  build: {
    outDir:     'dist',
    sourcemap:  false,
    emptyOutDir: true,
  },
})
