require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const users = await pool.query(
    `SELECT id, full_name, email FROM users
     WHERE full_name ILIKE '%muley%' OR full_name ILIKE '%refia%'
     ORDER BY full_name`
  );
  console.log('Users:', users.rows);

  const convs = await pool.query(
    `SELECT c.id,
      u1.full_name AS participant_a_name,
      u2.full_name AS participant_b_name,
      c.service_id,
      s.title AS service_title,
      c.last_message,
      c.last_msg_at
     FROM conversations c
     JOIN users u1 ON u1.id = c.participant_a
     JOIN users u2 ON u2.id = c.participant_b
     LEFT JOIN services s ON s.id = c.service_id
     ORDER BY c.last_msg_at DESC NULLS LAST`
  );
  console.log('Conversations:', convs.rows);

  const services = await pool.query(
    `SELECT s.id, s.title, u.full_name AS provider
     FROM services s JOIN users u ON u.id = s.provider_id
     WHERE s.title ILIKE '%garden%' OR s.title ILIKE '%photo%'
     ORDER BY s.title`
  );
  console.log('Relevant services:', services.rows);

  const orders = await pool.query(
    `SELECT o.id, s.title, u_b.full_name AS buyer, u_p.full_name AS provider, o.status, o.updated_at
     FROM orders o
     JOIN services s ON s.id = o.service_id
     JOIN users u_b ON u_b.id = o.buyer_id
     JOIN users u_p ON u_p.id = o.provider_id
     WHERE u_b.full_name IN ('refia', 'muleyks', 'muleykeee')
        OR u_p.full_name IN ('refia', 'muleyks', 'muleykeee')
     ORDER BY o.updated_at DESC`
  );
  console.log('Orders:', orders.rows);

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
