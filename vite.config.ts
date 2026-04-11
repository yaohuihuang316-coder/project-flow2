
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      // Externalize dependencies that are provided via importmap in index.html
      // to avoid resolution errors during build
      external: ['html2canvas', 'jspdf']
    }
  }
})
