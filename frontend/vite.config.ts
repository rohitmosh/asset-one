import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const keyPath = path.resolve(__dirname, '../nginx/certs/eams.key')
const certPath = path.resolve(__dirname, '../nginx/certs/eams.crt')
const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: hasCerts ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    } : undefined,
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
