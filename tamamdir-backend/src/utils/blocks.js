const { get, all } = require('../config/database');

async function isBlockedBetween(userIdA, userIdB) {
  if (!userIdA || !userIdB || userIdA === userIdB) return false;
  const row = await get(
    `SELECT 1 AS ok FROM user_blocks
     WHERE (blocker_id = ? AND blocked_id = ?)
        OR (blocker_id = ? AND blocked_id = ?)`,
    [userIdA, userIdB, userIdB, userIdA]
  );
  return !!row;
}

async function getBlockedUserIds(userId) {
  const rows = await all(
    `SELECT blocker_id, blocked_id FROM user_blocks
     WHERE blocker_id = ? OR blocked_id = ?`,
    [userId, userId]
  );
  const ids = new Set();
  for (const row of rows) {
    if (row.blocker_id === userId) ids.add(row.blocked_id);
    if (row.blocked_id === userId) ids.add(row.blocker_id);
  }
  return ids;
}

module.exports = { isBlockedBetween, getBlockedUserIds };
