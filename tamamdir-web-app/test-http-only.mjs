import { createServer } from 'http'

console.log('1. Creating HTTP server...');
const httpServer = createServer();

console.log('2. Listening...');
httpServer.listen(5173, '127.0.0.1', () => {
  console.log('3. Server listening on 5173!');
  
  setTimeout(() => {
    console.log('4. Closing...');
    httpServer.close();
    process.exit(0);
  }, 3000);
});
