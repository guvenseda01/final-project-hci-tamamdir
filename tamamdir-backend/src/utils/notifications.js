const { v4: uuidv4 } = require('uuid');
const { run } = require('../config/database');

async function createNotification({ user_id, type, title, body, ref_id }) {
  await run(
    'INSERT INTO notifications (id, user_id, type, title, body, ref_id) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), user_id, type, title, body || null, ref_id || null]
  );
}

module.exports = { createNotification };
