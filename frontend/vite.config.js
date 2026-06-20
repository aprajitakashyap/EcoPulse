import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Split vendor chunks so Firebase doesn't block initial paint
        manualChunks(id) {
          if (id.includes('firebase/auth'))      return 'firebase-auth';
          if (id.includes('firebase/firestore')) return 'firebase-store';
          if (id.includes('firebase'))           return 'firebase-core';
          if (id.includes('react-router-dom') || id.includes('react-router'))
                                                 return 'vendor-router';
          if (id.includes('node_modules'))       return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 400,
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api':    { target: 'http://localhost:8080', changeOrigin: true },
      '/health': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
