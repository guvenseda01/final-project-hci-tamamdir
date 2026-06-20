import { createServer as createViteServer } from 'vite'
import react from '@vitejs/plugin-react'

console.log('[1] Creating server with React plugin...');
const vite = await createViteServer({
  plugins: [react()],
});
console.log('[2] Success!');
process.exit(0);
