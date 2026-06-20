console.log('1. Script started');
console.log('2. About to import vite');

const viteModule = await import('vite');
console.log('3. Vite imported, version:', viteModule.VERSION);

const createServer = viteModule.createServer;
console.log('4. createServer function obtained:', typeof createServer);

console.log('5. About to import config');
const configModule = await import('./vite.config.js');
console.log('6. Config imported:', Object.keys(configModule));

console.log('7. Config default:', configModule.default);

console.log('8. About to call createServer');
const serverPromise = createServer(configModule.default);
console.log('9. createServer returned promise');

const server = await serverPromise;
console.log('10. Server created');

console.log('11. About to call server.listen');
await server.listen(5173);
console.log('12. Server listening');

