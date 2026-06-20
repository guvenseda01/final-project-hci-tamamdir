import { createServer as createViteServer } from 'vite'
import react from '@vitejs/plugin-react'

console.log('[1] Creating server with proxy...');
const vite = await createViteServer({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
console.log('[2] Success!');
process.exit(0);
