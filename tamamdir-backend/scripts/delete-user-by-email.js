#!/usr/bin/env node
/**
 * Hard-delete a user and related rows (for dev / admin reset).
 * Usage: node scripts/delete-user-by-email.js user@example.com
 */
process.chdir(require('path').join(__dirname, '..'));
require('dotenv').config();

const { initDB, run, get, all } = require('../src/config/database');

async function deleteUserByEmail(email) {
  const user = await get('SELECT id, email, full_name FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  if (!user) {
    console.log(`No user found with email: ${email}`);
    return;
  }

  const uid = user.id;
  console.log(`Deleting user ${user.full_name} (${user.email}) — id ${uid}`);

  const serviceIds = (await all('SELECT id FROM services WHERE provider_id = ?', [uid])).map(r => r.id);
  const convIds = (await all(
    'SELECT id FROM conversations WHERE participant_a = ? OR participant_b = ?',
    [uid, uid]
  )).map(r => r.id);
  const orderIds = (await all(
    'SELECT id FROM orders WHERE buyer_id = ? OR provider_id = ?',
    [uid, uid]
  )).map(r => r.id);

  if (orderIds.length) {
    await run(`DELETE FROM reviews WHERE order_id IN (${orderIds.map(() => '?').join(',')})`, orderIds);
    await run(`DELETE FROM user_reviews WHERE order_id IN (${orderIds.map(() => '?').join(',')})`, orderIds);
    await run(`DELETE FROM orders WHERE id IN (${orderIds.map(() => '?').join(',')})`, orderIds);
  }

  await run('DELETE FROM reviews WHERE reviewer_id = ? OR provider_id = ?', [uid, uid]);
  await run('DELETE FROM user_reviews WHERE reviewer_id = ? OR reviewee_id = ?', [uid, uid]);
  await run('DELETE FROM reports WHERE reporter_id = ?', [uid]);

  if (serviceIds.length) {
    await run(`DELETE FROM service_images WHERE service_id IN (${serviceIds.map(() => '?').join(',')})`, serviceIds);
    await run(`DELETE FROM service_favorites WHERE service_id IN (${serviceIds.map(() => '?').join(',')})`, serviceIds);
    await run(`DELETE FROM services WHERE provider_id = ?`, [uid]);
  }

  if (convIds.length) {
    await run(`DELETE FROM messages WHERE conversation_id IN (${convIds.map(() => '?').join(',')})`, convIds);
    await run(`DELETE FROM conversation_tamamdir WHERE conversation_id IN (${convIds.map(() => '?').join(',')})`, convIds);
    await run(`DELETE FROM conversation_service_arrangements WHERE conversation_id IN (${convIds.map(() => '?').join(',')})`, convIds);
    await run(`DELETE FROM conversations WHERE id IN (${convIds.map(() => '?').join(',')})`, convIds);
  }

  await run('DELETE FROM messages WHERE sender_id = ?', [uid]);
  await run('DELETE FROM notifications WHERE user_id = ?', [uid]);
  await run('DELETE FROM user_interests WHERE user_id = ?', [uid]);
  await run('DELETE FROM service_favorites WHERE user_id = ?', [uid]);
  await run('DELETE FROM email_verifications WHERE user_id = ?', [uid]);
  await run('DELETE FROM users WHERE id = ?', [uid]);

  console.log('Done.');
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/delete-user-by-email.js <email>');
  process.exit(1);
}

initDB()
  .then(() => deleteUserByEmail(email))
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
