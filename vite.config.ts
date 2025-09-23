import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/gpsccu-loan-tracker/', // Replace with your repository name
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
