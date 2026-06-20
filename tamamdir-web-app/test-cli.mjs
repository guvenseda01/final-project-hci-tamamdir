console.log('1. About to import vite cli...');
const cli = await import('./node_modules/vite/dist/node/cli.js');
console.log('2. CLI imported');
process.exit(0);
