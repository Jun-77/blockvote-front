import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',       // Vercel이 읽는 빌드 output dir
    emptyOutDir: true,    // 항상 깨끗하게
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // dev only
        changeOrigin: true,
      },
    },
  },
})
