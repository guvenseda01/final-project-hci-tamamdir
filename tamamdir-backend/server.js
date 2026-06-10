process.chdir(__dirname);          // ensure dotenv and relative paths resolve correctly
require('dotenv').config();

const app = require('./src/app');
const { initDB } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`✅ Tamamdır backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
