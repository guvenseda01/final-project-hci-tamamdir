import { createServer as createViteServer } from 'vite'
import { createServer as createHttpServer } from 'http'

console.log('[1] Starting minimal test...');

try {
  console.log('[2] Creating Vite server with empty config...');
  const vite = await createViteServer({});
  console.log('[3] Success!');
  process.exit(0);
} catch (err) {
  console.error('[ERROR]', err.message);
  process.exit(1);
}
