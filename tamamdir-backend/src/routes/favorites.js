const router = require('express').Router();
const { run, get, all } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

router.get('/services', requireAuth, async (req, res, next) => {
  try {
    const services = await all(
      `SELECT s.*,
              c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
              u.full_name AS provider_name, u.avatar_url AS provider_avatar,
              (CASE WHEN u.is_verified = 1 AND u.is_verified_student = 1 THEN 1 ELSE 0 END) AS provider_verified,
              u.rating AS provider_rating
       FROM service_favorites f
       JOIN services s ON s.id = f.service_id
       JOIN categories c ON c.id = s.category_id
       JOIN users u ON u.id = s.provider_id
       WHERE f.user_id = ? AND s.is_active = 1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    for (const svc of services) {
      const img = await get(
        'SELECT image_url FROM service_images WHERE service_id = ? AND is_cover = 1 LIMIT 1',
        [svc.id]
      );
      svc.cover_image = img ? img.image_url : null;
    }

    res.json(services);
  } catch (err) {
    next(err);
  }
});

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
