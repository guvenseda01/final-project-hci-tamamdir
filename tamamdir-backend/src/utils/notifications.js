const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../config/database');

async function createNotification({ user_id, type, title, body, ref_id, io }) {
  const id = uuidv4();
  await run(
    'INSERT INTO notifications (id, user_id, type, title, body, ref_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, user_id, type, title, body || null, ref_id || null]
  );

  const notification = await get(
    `SELECT id, user_id, type, title, body, is_read, ref_id, created_at
     FROM notifications WHERE id = ?`,
    [id]
  );

  if (io && notification) {
    io.to(`user:${user_id}`).emit('notification:new', notification);
  }

  return notification;
}

module.exports = { createNotification };
