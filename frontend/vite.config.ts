import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('react/')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide';
            }
            if (id.includes('canvas-confetti')) {
              return 'confetti';
            }
          }
        },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
})
