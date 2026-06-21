/**
 * Fixes conversation.service_id polluted by earlier bugs.
 * Run: node scripts/fix-conversation-services.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // muleyks ↔ muleykeee: no orders — photography service_id was wrongly attached
  const muleyksConv = await pool.query(
    `SELECT c.id, c.service_id, s.title
     FROM conversations c
     LEFT JOIN services s ON s.id = c.service_id
     JOIN users u1 ON u1.id = c.participant_a
     JOIN users u2 ON u2.id = c.participant_b
     WHERE u1.full_name = 'muleykeee' AND u2.full_name = 'muleyks'`
  );

  if (muleyksConv.rows[0]?.service_id) {
    await pool.query(
      'UPDATE conversations SET service_id = NULL WHERE id = $1',
      [muleyksConv.rows[0].id]
    );
    console.log(
      'Cleared wrong service on muleyks chat (was:',
      muleyksConv.rows[0].title,
      ')'
    );
  }

  const convs = await pool.query(
    `SELECT c.id,
      u1.full_name AS a, u2.full_name AS b,
      c.service_id, s.title AS service_title
     FROM conversations c
     JOIN users u1 ON u1.id = c.participant_a
     JOIN users u2 ON u2.id = c.participant_b
     LEFT JOIN services s ON s.id = c.service_id
     WHERE u1.full_name IN ('muleykeee', 'refia', 'muleyks')
        OR u2.full_name IN ('muleykeee', 'refia', 'muleyks')
     ORDER BY c.last_msg_at DESC NULLS LAST`
  );
  console.log('After fix:', convs.rows);

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
