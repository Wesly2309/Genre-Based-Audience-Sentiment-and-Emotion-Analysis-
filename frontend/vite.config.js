import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hilangkan warning ukuran file besar
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // naikkan batas jadi 1MB
  },
})