const router = require('express').Router();
const { all, run } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await all(
      `SELECT id, type, title, body, is_read, ref_id, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await run(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    await run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
