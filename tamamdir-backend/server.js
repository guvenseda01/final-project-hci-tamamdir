process.chdir(__dirname);          // ensure dotenv and relative paths resolve correctly
require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { initDB } = require('./src/config/database');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 3000;

async function start() {
  await initDB();

  const server = http.createServer(app);
  const io = initSocket(server);
  app.set('io', io);

  server.listen(PORT, () => {
    console.log(`✅ Tamamdır backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
