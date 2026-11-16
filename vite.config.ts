import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Local development only: forwards /api/n8n/* to your n8n instance so the contact form works on localhost.
// The target comes from VITE_N8N_WEBHOOK_URL in .env (production uses the rewrite in vercel.json).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let n8nOrigin = ''
  try {
    n8nOrigin = env.VITE_N8N_WEBHOOK_URL ? new URL(env.VITE_N8N_WEBHOOK_URL).origin : ''
  } catch {
    n8nOrigin = ''
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: n8nOrigin
        ? {
            '/api/n8n-test': {
              target: n8nOrigin,
              changeOrigin: true,
              secure: true,
              rewrite: (path: string) => path.replace(/^\/api\/n8n-test/, '/webhook-test'),
            },
            '/api/n8n': {
              target: n8nOrigin,
              changeOrigin: true,
              secure: true,
              rewrite: (path: string) => path.replace(/^\/api\/n8n/, '/webhook'),
            },
          }
        : {},
    },
  }
})
