console.log('Starting vite...');
console.time('vite-startup');

try {
  const { createServer } = await import('vite');
  console.log('Vite imported successfully');
  
  const config = await import('./vite.config.js');
  console.log('Config imported');
  
  const server = await createServer({
    ...config.default,
    server: {
      ...config.default.server,
      middlewareMode: false,
    },
  });
  
  console.log('Server created');
  
  await server.listen(5173);
  console.log('Server listening on port 5173');
  console.timeEnd('vite-startup');
  
  const info = server.httpServer?.address();
  console.log('Server address:', info);
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
