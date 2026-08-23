import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Raise chunk size warning limit to avoid false alarms
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor libraries into separate cacheable chunks
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'lucide': ['lucide-react'],
          'confetti': ['canvas-confetti'],
        },
      },
    },
    // Enable source map for production debugging (optional, remove if not needed)
    sourcemap: false,
    // Minify with esbuild (faster than terser, good enough for prod)
    minify: 'esbuild',
    target: 'esnext',
  },
  // Ensure consistent module IDs for better caching
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
})
