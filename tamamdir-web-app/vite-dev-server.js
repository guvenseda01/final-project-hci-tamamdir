import { createServer as createViteServer } from 'vite'
import { createServer as createHttpServer } from 'http'
import react from '@vitejs/plugin-react'

try {
  console.log('🚀 Starting Vite dev server...')
  const vite = await createViteServer({
    plugins: [react()],
    server: {
      middlewareMode: true,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  })
  console.log('✓ Vite server created')

  const httpServer = createHttpServer()
  console.log('✓ HTTP server created')

  httpServer.on('request', vite.middlewares)
  console.log('✓ Middleware attached')

  const PORT = 5173
  await new Promise((resolve, reject) => {
    httpServer.listen(PORT, '127.0.0.1', () => {
      console.log(`✅ Vite dev server ready at http://localhost:${PORT}`)
      console.log(`📡 API proxy: /api → http://localhost:4000`)
      resolve()
    });

    httpServer.on('error', reject)
  })

  process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down...')
    await vite.close()
    httpServer.close()
    process.exit(0)
  })
} catch (err) {
  console.error('❌ Failed to start dev server:', err.message)
  process.exit(1)
}
