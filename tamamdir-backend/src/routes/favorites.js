const router = require('express').Router();
const { run, get, all } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await all(
      'SELECT service_id FROM service_favorites WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows.map((r) => r.service_id));
  } catch (err) {
    next(err);
  }
});

router.get('/:serviceId', requireAuth, async (req, res, next) => {
  try {
    const row = await get(
      'SELECT 1 AS ok FROM service_favorites WHERE user_id = ? AND service_id = ?',
      [req.user.id, req.params.serviceId]
    );
    res.json({ favorited: !!row });
  } catch (err) {
    next(err);
  }
});

router.post('/:serviceId', requireAuth, async (req, res, next) => {
  try {
    const svc = await get('SELECT id FROM services WHERE id = ?', [req.params.serviceId]);
    if (!svc) return res.status(404).json({ error: 'Service not found' });

    await run(
      'INSERT INTO service_favorites (user_id, service_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.serviceId]
    );
    res.status(201).json({ favorited: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:serviceId', requireAuth, async (req, res, next) => {
  try {
    await run(
      'DELETE FROM service_favorites WHERE user_id = ? AND service_id = ?',
      [req.user.id, req.params.serviceId]
    );
    res.json({ favorited: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
