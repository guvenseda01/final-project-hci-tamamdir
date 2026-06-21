/**
 * Delete all chat data. Run: node scripts/clear-all-chats.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const before = await pool.query('SELECT COUNT(*) AS n FROM conversations');
  const msgBefore = await pool.query('SELECT COUNT(*) AS n FROM messages');

  await pool.query('DELETE FROM messages');
  await pool.query('DELETE FROM conversation_tamamdir');
  await pool.query('DELETE FROM conversation_service_arrangements');
  await pool.query('DELETE FROM conversations');
  await pool.query(
    "DELETE FROM notifications WHERE type = 'message_new'"
  );

  const after = await pool.query('SELECT COUNT(*) AS n FROM conversations');
  const msgAfter = await pool.query('SELECT COUNT(*) AS n FROM messages');

  console.log(`Removed ${before.rows[0].n} conversations and ${msgBefore.rows[0].n} messages.`);
  console.log(`Remaining: ${after.rows[0].n} conversations, ${msgAfter.rows[0].n} messages.`);

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
