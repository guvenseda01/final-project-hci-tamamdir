/**
 * Reset tamamdır / cancel / ban state without deleting messages.
 * Run: node scripts/clear-tamamdir-state.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const tamamdir = await pool.query('SELECT COUNT(*) AS n FROM conversation_tamamdir');
  const arrangements = await pool.query('SELECT COUNT(*) AS n FROM conversation_service_arrangements');

  await pool.query('DELETE FROM conversation_tamamdir');
  await pool.query('DELETE FROM conversation_service_arrangements');

  console.log(
    `Cleared ${tamamdir.rows[0].n} tamamdir confirm(s) and ${arrangements.rows[0].n} arrangement row(s).`
  );
  console.log('Messages and conversations are unchanged.');

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
