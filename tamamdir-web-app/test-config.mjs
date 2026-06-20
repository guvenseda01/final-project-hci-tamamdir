console.log('1. Loading vite config...');
const config = await import('./vite.config.js');
console.log('2. Config loaded:', config.default);
process.exit(0);
