import { createServer as createViteServer } from 'vite'
import { createServer as createHttpServer } from 'http'

console.log('[1] Script started');

try {
  console.log('[2] Creating Vite server...');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
    },
  });
  console.log('[3] Vite server created');
  
  console.log('[4] Creating HTTP server...');
  const httpServer = createHttpServer();
  
  console.log('[5] Setting up request handler...');
  httpServer.on('request', (req, res) => {
    console.log('  → Request:', req.method, req.url);
    vite.middlewares(req, res);
  });
  
  console.log('[6] About to listen on 5173...');
  await new Promise((resolve, reject) => {
    httpServer.listen(5173, '127.0.0.1', () => {
      console.log('[7] Server listening!');
      resolve();
    });
    setTimeout(() => reject(new Error('Listen timeout')), 5000);
  });
  
  console.log('[8] Setup complete!');
  process.exit(0);
} catch (err) {
  console.error('[ERROR]', err.message);
  process.exit(1);
}
