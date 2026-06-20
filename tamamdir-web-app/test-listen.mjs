const vite = await import('vite');
const config = await import('./vite.config.js');

console.log('Creating server...');
const server = await vite.createServer(config.default);

console.log('Listening on port 5174...');
await server.listen(5174);
console.log('Listening!');

setTimeout(() => {
  console.log('Closing server...');
  server.close();
  process.exit(0);
}, 3000);
