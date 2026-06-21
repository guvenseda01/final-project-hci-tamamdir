const { get } = require('../config/database');

async function requireAdmin(req, res, next) {
  try {
    const row = await get(
      'SELECT is_admin FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL',
      [req.user.id]
    );
    if (!row || row.is_admin !== 1) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAdmin };
