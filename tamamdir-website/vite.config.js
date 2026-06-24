import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5175,
      strictPort: true,
      host: true,
      proxy: {
        '/mobile': { target: 'http://localhost:5174', changeOrigin: true },
        '/api': { target: apiTarget, changeOrigin: true },
        '/uploads': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
