/**
 * /api/services
 *
 * GET    /                     – list / search services (public)
 * POST   /                     – create service (auth)
 * GET    /:id                  – service detail (public)
 * PATCH  /:id                  – update service (owner)
 * DELETE /:id                  – soft-delete service (owner)
 * POST   /:id/images           – upload portfolio images (owner)
 * DELETE /:id/images/:imageId  – remove portfolio image (owner)
 */
const router = require('express').Router();
const { body, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get, all } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { serviceImageUpload } = require('../middleware/upload');

// ── GET /api/services ───────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      q,            // free-text search
      category,     // category slug or id
      min_price,
      max_price,
      sort = 'newest', // newest | rating | price_asc | price_desc | popular
      page  = 1,
      limit = 20,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const where  = ['s.is_active = 1'];

    if (q) {
      where.push('(s.title LIKE ? OR s.description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    if (category) {
      where.push('(c.slug = ? OR c.id = ?)');
      params.push(category, category);
    }

    if (min_price) {
      where.push('s.price >= ?');
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      where.push('s.price <= ?');
      params.push(parseFloat(max_price));
    }

    const ORDER_MAP = {
      newest:     's.created_at DESC',
      rating:     's.rating DESC',
      price_asc:  's.price ASC',
      price_desc: 's.price DESC',
      popular:    's.order_count DESC',
    };
    const orderBy = ORDER_MAP[sort] || ORDER_MAP.newest;

    const sql = `
      SELECT s.*,
             c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
             u.full_name AS provider_name, u.avatar_url AS provider_avatar,
             u.is_verified AS provider_verified, u.rating AS provider_rating
      FROM services s
      JOIN categories c ON c.id = s.category_id
      JOIN users u      ON u.id = s.provider_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM services s
      JOIN categories c ON c.id = s.category_id
      WHERE ${where.join(' AND ')}
    `;

    const [services, countRow] = await Promise.all([
      all(sql, [...params, parseInt(limit), offset]),
      get(countSql, params),
    ]);

    // Attach cover images
    for (const svc of services) {
      const img = await get(
        'SELECT image_url FROM service_images WHERE service_id = ? AND is_cover = 1 LIMIT 1',
        [svc.id]
      );
      svc.cover_image = img ? img.image_url : null;
    }

    return res.json({
      services,
      pagination: {
        total:   countRow.total,
        page:    parseInt(page),
        limit:   parseInt(limit),
        pages:   Math.ceil(countRow.total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/services ──────────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().isLength({ max: 2000 }),
    body('category_id').notEmpty(),
    body('price').isFloat({ min: 1 }),
    body('price_unit').optional().isIn(['session', 'hour', 'item', 'day', 'piece']),
    body('delivery_days').optional().isInt({ min: 1, max: 90 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { title, description, category_id, price, price_unit = 'session', delivery_days = 1 } = req.body;

      // Verify category exists
      const cat = await get('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (!cat) return res.status(404).json({ error: 'Category not found' });

      const id = uuidv4();
      await run(
        `INSERT INTO services (id, provider_id, category_id, title, description, price, price_unit, delivery_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, req.user.id, category_id, title, description, price, price_unit, delivery_days]
      );

      // Mark user as provider
      await run('UPDATE users SET is_provider = 1 WHERE id = ?', [req.user.id]);

      const service = await getFullService(id);
      return res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/services/:id ───────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const service = await getFullService(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    return res.json(service);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/services/:id ─────────────────────────────────────────────────
router.patch(
  '/:id',
  requireAuth,
  [
    body('title').optional().trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().isLength({ max: 2000 }),
    body('price').optional().isFloat({ min: 1 }),
    body('price_unit').optional().isIn(['session', 'hour', 'item', 'day', 'piece']),
    body('delivery_days').optional().isInt({ min: 1, max: 90 }),
    body('is_active').optional().isBoolean(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const existing = await get('SELECT provider_id FROM services WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Service not found' });
      if (existing.provider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

      const fields  = ['title', 'description', 'price', 'price_unit', 'delivery_days', 'is_active'];
      const updates = [];
      const values  = [];

      fields.forEach(f => {
        if (req.body[f] !== undefined) {
          updates.push(`${f} = ?`);
          values.push(req.body[f]);
        }
      });

      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);

      await run(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`, values);
      const updated = await getFullService(req.params.id);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/services/:id ────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await get('SELECT provider_id FROM services WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Service not found' });
    if (existing.provider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await run("UPDATE services SET is_active = 0, updated_at = datetime('now') WHERE id = ?", [req.params.id]);
    return res.json({ message: 'Service deactivated' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/services/:id/images ───────────────────────────────────────────
router.post(
  '/:id/images',
  requireAuth,
  serviceImageUpload.array('images', 10),
  async (req, res, next) => {
    try {
      const svc = await get('SELECT provider_id FROM services WHERE id = ?', [req.params.id]);
      if (!svc) return res.status(404).json({ error: 'Service not found' });
      if (svc.provider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

      // Check if a cover already exists
      const hasCover = await get(
        'SELECT id FROM service_images WHERE service_id = ? AND is_cover = 1',
        [req.params.id]
      );

      const inserted = [];
      for (let i = 0; i < req.files.length; i++) {
        const imgId    = uuidv4();
        const url      = `/uploads/services/${req.files[i].filename}`;
        const isCover  = !hasCover && i === 0 ? 1 : 0;

        await run(
          'INSERT INTO service_images (id, service_id, image_url, is_cover, sort_order) VALUES (?, ?, ?, ?, ?)',
          [imgId, req.params.id, url, isCover, i]
        );
        inserted.push({ id: imgId, image_url: url, is_cover: !!isCover });
      }

      return res.status(201).json(inserted);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/services/:id/images/:imageId ────────────────────────────────
router.delete('/:id/images/:imageId', requireAuth, async (req, res, next) => {
  try {
    const svc = await get('SELECT provider_id FROM services WHERE id = ?', [req.params.id]);
    if (!svc) return res.status(404).json({ error: 'Service not found' });
    if (svc.provider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await run(
      'DELETE FROM service_images WHERE id = ? AND service_id = ?',
      [req.params.imageId, req.params.id]
    );
    return res.json({ message: 'Image removed' });
  } catch (err) {
    next(err);
  }
});

// ── Helper ───────────────────────────────────────────────────────────────────
async function getFullService(id) {
  const service = await get(
    `SELECT s.*,
            c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
            u.full_name AS provider_name, u.avatar_url AS provider_avatar,
            u.bio AS provider_bio, u.department AS provider_department,
            u.year AS provider_year, u.is_verified AS provider_verified,
            u.rating AS provider_rating, u.review_count AS provider_review_count
     FROM services s
     JOIN categories c ON c.id = s.category_id
     JOIN users u      ON u.id = s.provider_id
     WHERE s.id = ?`,
    [id]
  );
  if (!service) return null;

  service.images = await all(
    'SELECT id, image_url, is_cover, sort_order FROM service_images WHERE service_id = ? ORDER BY sort_order',
    [id]
  );

  service.recent_reviews = await all(
    `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
     FROM reviews r JOIN users u ON u.id = r.reviewer_id
     WHERE r.service_id = ?
     ORDER BY r.created_at DESC LIMIT 5`,
    [id]
  );

  return service;
}

module.exports = router;
