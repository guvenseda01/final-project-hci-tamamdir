console.log('1. Loading @vitejs/plugin-react...');
const react = await import('@vitejs/plugin-react');
console.log('2. React plugin loaded:', typeof react.default);
process.exit(0);
