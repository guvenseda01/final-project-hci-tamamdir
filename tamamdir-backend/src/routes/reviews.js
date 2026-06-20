/**
 * /api/reviews
 *
 * POST /            – leave a review for a completed order (buyer only)
 * GET  /service/:id – all reviews for a service
 * GET  /user/:id    – all reviews for a provider
 */
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get, all } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// ── POST /api/reviews ────────────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  [
    body('order_id').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: 1000 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { order_id, rating, comment } = req.body;

      const order = await get('SELECT * FROM orders WHERE id = ?', [order_id]);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Only the buyer can leave a review' });
      if (order.status !== 'completed') return res.status(400).json({ error: 'Order is not yet completed' });

      const existing = await get('SELECT id FROM reviews WHERE order_id = ?', [order_id]);
      if (existing) return res.status(409).json({ error: 'Review already submitted for this order' });

      const id = uuidv4();
      await run(
        `INSERT INTO reviews (id, order_id, service_id, reviewer_id, provider_id, rating, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, order_id, order.service_id, req.user.id, order.provider_id, rating, comment || null]
      );

      // Recalculate service rating
      await recalcServiceRating(order.service_id);
      // Recalculate provider rating
      await recalcProviderRating(order.provider_id);

      const review = await get(
        `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
         FROM reviews r JOIN users u ON u.id = r.reviewer_id
         WHERE r.id = ?`,
        [id]
      );

      return res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/reviews/service/:id ─────────────────────────────────────────────
router.get('/service/:id', async (req, res, next) => {
  try {
    const reviews = await all(
      `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.service_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    return res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/reviews/user/:id ────────────────────────────────────────────────
router.get('/user/:id', async (req, res, next) => {
  try {
    const reviews = await all(
      `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar,
              s.title AS service_title
       FROM reviews r
       JOIN users u    ON u.id = r.reviewer_id
       JOIN services s ON s.id = r.service_id
       WHERE r.provider_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    return res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function recalcServiceRating(serviceId) {
  const row = await get(
    'SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE service_id = ?',
    [serviceId]
  );
  await run(
    'UPDATE services SET rating = ?, review_count = ? WHERE id = ?',
    [Math.round((row.avg || 0) * 10) / 10, row.cnt, serviceId]
  );
}

async function recalcProviderRating(providerId) {
  const row = await get(
    'SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE provider_id = ?',
    [providerId]
  );
  await run(
    'UPDATE users SET rating = ?, review_count = ? WHERE id = ?',
    [Math.round((row.avg || 0) * 10) / 10, row.cnt, providerId]
  );
}

module.exports = router;
