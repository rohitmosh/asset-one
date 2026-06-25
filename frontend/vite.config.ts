import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../nginx/certs/eams.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../nginx/certs/eams.crt')),
    },
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:8000',
        secure: false, // Bypass self-signed check for localhost development proxying
        changeOrigin: true,
      }
    }
  }
})
