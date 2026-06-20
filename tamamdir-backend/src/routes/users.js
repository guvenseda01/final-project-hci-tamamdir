/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User profiles and preferences
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user public profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *   patch:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               bio:
 *                 type: string
 *               department:
 *                 type: string
 *               year:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/users/{id}/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload user avatar
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 */

/**
 * @swagger
 * /api/users/{id}/interests:
 *   get:
 *     tags: [Users]
 *     summary: Get user interests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of interests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *   put:
 *     tags: [Users]
 *     summary: Update user interests
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_ids]
 *             properties:
 *               category_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Interests updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/users/{id}/services:
 *   get:
 *     tags: [Users]
 *     summary: Get services offered by user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */

/**
 * @swagger
 * /api/users/{id}/orders:
 *   get:
 *     tags: [Users]
 *     summary: Get user order history
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */

const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get, all } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');

// ── GET /api/users/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const user = await get(
      `SELECT id, full_name, avatar_url, bio, department, year,
              is_verified, is_provider, rating, review_count, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const interests = await all(
      `SELECT c.id, c.name, c.icon, c.slug
       FROM user_interests ui JOIN categories c ON c.id = ui.category_id
       WHERE ui.user_id = ?`,
      [user.id]
    );

    return res.json({ ...user, interests });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/users/:id ────────────────────────────────────────────────────
router.patch(
  '/:id',
  requireAuth,
  [
    body('full_name').optional().trim().notEmpty(),
    body('bio').optional().isLength({ max: 500 }),
    body('department').optional().trim(),
    body('year').optional().isIn(['1st', '2nd', '3rd', '4th', 'Grad']),
  ],
  async (req, res, next) => {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const fields  = ['full_name', 'bio', 'department', 'year'];
      const updates = [];
      const values  = [];

      fields.forEach(f => {
        if (req.body[f] !== undefined) {
          updates.push(`${f} = ?`);
          values.push(req.body[f]);
        }
      });

      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

      updates.push("updated_at = NOW()");
      values.push(req.params.id);

      await run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updated = await get(
        `SELECT id, full_name, avatar_url, bio, department, year,
                is_verified, is_provider, rating, review_count, wallet_balance, total_earnings
         FROM users WHERE id = ?`,
        [req.params.id]
      );
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/users/:id/avatar ──────────────────────────────────────────────
router.post(
  '/:id/avatar',
  requireAuth,
  avatarUpload.single('avatar'),
  async (req, res, next) => {
    if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const url = `/uploads/avatars/${req.file.filename}`;
      await run('UPDATE users SET avatar_url = ? WHERE id = ?', [url, req.params.id]);
      return res.json({ avatar_url: url });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/users/:id/interests ────────────────────────────────────────────
router.get('/:id/interests', async (req, res, next) => {
  try {
    const rows = await all(
      `SELECT c.id, c.name, c.icon, c.slug
       FROM user_interests ui JOIN categories c ON c.id = ui.category_id
       WHERE ui.user_id = ?`,
      [req.params.id]
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/users/:id/interests ────────────────────────────────────────────
// Body: { category_ids: ["uuid1", "uuid2", …] }
router.put('/:id/interests', requireAuth, async (req, res, next) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });

  const { category_ids } = req.body;
  if (!Array.isArray(category_ids)) {
    return res.status(422).json({ error: 'category_ids must be an array' });
  }

  try {
    await run('DELETE FROM user_interests WHERE user_id = ?', [req.params.id]);
    for (const cid of category_ids) {
      await run(
        'INSERT INTO user_interests (user_id, category_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
        [req.params.id, cid]
      );
    }

    const updated = await all(
      `SELECT c.id, c.name, c.icon, c.slug
       FROM user_interests ui JOIN categories c ON c.id = ui.category_id
       WHERE ui.user_id = ?`,
      [req.params.id]
    );
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/:id/services ─────────────────────────────────────────────
router.get('/:id/services', async (req, res, next) => {
  try {
    const services = await all(
      `SELECT s.*, c.name AS category_name, c.slug AS category_slug
       FROM services s JOIN categories c ON c.id = s.category_id
       WHERE s.provider_id = ? AND s.is_active = 1
       ORDER BY s.created_at DESC`,
      [req.params.id]
    );

    // Attach cover image
    for (const svc of services) {
      const img = await get(
        'SELECT image_url FROM service_images WHERE service_id = ? AND is_cover = 1 LIMIT 1',
        [svc.id]
      );
      svc.cover_image = img ? img.image_url : null;
    }

    return res.json(services);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/:id/orders ───────────────────────────────────────────────
router.get('/:id/orders', requireAuth, async (req, res, next) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { role = 'buyer' } = req.query; // "buyer" | "provider"
    const field = role === 'provider' ? 'provider_id' : 'buyer_id';

    const orders = await all(
      `SELECT o.*,
              s.title AS service_title, s.price AS service_price,
              u_b.full_name AS buyer_name, u_b.avatar_url AS buyer_avatar,
              u_p.full_name AS provider_name, u_p.avatar_url AS provider_avatar
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN users u_b  ON u_b.id = o.buyer_id
       JOIN users u_p  ON u_p.id = o.provider_id
       WHERE o.${field} = ?
       ORDER BY o.created_at DESC`,
      [req.params.id]
    );
    return res.json(orders);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
