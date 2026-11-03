import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/n8n-test': {
        target: 'https://ucy00zep.rpcld.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/n8n-test/, '/webhook-test'),
      },
      '/api/n8n': {
        target: 'https://ucy00zep.rpcld.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/n8n/, '/webhook'),
      },
    },
  },
})

