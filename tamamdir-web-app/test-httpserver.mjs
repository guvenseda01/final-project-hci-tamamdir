import { createServer } from 'vite';
import { createServer as createHttpServer } from 'http';
const config = await import('./vite.config.js');

console.log('Creating vite server...');
const viteServer = await createServer(config.default);

console.log('Creating HTTP server...');
const httpServer = createHttpServer();

console.log('Attaching vite middleware...');
httpServer.on('request', viteServer.middlewares);

console.log('Listening on port 5175...');
await new Promise((resolve) => {
  httpServer.listen(5175, () => {
    console.log('HTTP server listening!');
    resolve();
  });
});

setTimeout(() => {
  console.log('Closing...');
  viteServer.close();
  httpServer.close();
  process.exit(0);
}, 3000);
