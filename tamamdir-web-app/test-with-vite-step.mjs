import { createServer as createViteServer } from 'vite'
import { createServer as createHttpServer } from 'http'
import react from '@vitejs/plugin-react'

console.log('1. Creating Vite server...');
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
});
console.log('2. Vite server created');

console.log('3. Creating HTTP server...');
const httpServer = createHttpServer();
console.log('4. HTTP server created');

console.log('5. Setting up request handler...');
httpServer.on('request', vite.middlewares);
console.log('6. Request handler set');

console.log('7. Calling listen...');
const listenPromise = new Promise((resolve, reject) => {
  httpServer.listen(5173, '127.0.0.1', () => {
    console.log('8. Listening!');
    resolve();
  });
  
  setTimeout(() => {
    console.log('[TIMEOUT] Listen took too long');
    reject(new Error('Timeout'));
  }, 5000);
});

try {
  await listenPromise;
  console.log('9. Success!');
  process.exit(0);
} catch (err) {
  console.error('[ERROR]', err.message);
  process.exit(1);
}
