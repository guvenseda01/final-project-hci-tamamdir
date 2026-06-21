/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Service reviews and ratings
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get, all } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');
const {
  completeArrangementCycleIfBothReviewed,
} = require('../utils/tamamdirArrangement');

const COMMENT_MAX = 400;

// ── POST /api/reviews — customer reviews a service ───────────────────────────
router.post(
  '/',
  requireAuth,
  [
    body('order_id').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: COMMENT_MAX }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { order_id, rating, comment } = req.body;

      const order = await get('SELECT * FROM orders WHERE id = ?', [order_id]);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.buyer_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the customer can leave a service review' });
      }
      if (order.status !== 'completed') {
        return res.status(400).json({ error: 'Order is not yet completed' });
      }

      const existing = await get('SELECT id FROM reviews WHERE order_id = ?', [order_id]);
      if (existing) {
        return res.status(409).json({ error: 'Review already submitted for this order' });
      }

      const prior = await get(
        `SELECT id FROM reviews
         WHERE service_id = ? AND reviewer_id = ?
         ORDER BY created_at DESC LIMIT 1`,
        [order.service_id, req.user.id]
      );

      let id;
      if (prior) {
        id = prior.id;
        await run(
          'UPDATE reviews SET order_id = ?, rating = ?, comment = ? WHERE id = ?',
          [order_id, rating, comment || null, id]
        );
      } else {
        id = uuidv4();
        await run(
          `INSERT INTO reviews (id, order_id, service_id, reviewer_id, provider_id, rating, comment)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, order_id, order.service_id, req.user.id, order.provider_id, rating, comment || null]
        );
      }

      await recalcServiceRating(order.service_id);
      await recalcProviderRating(order.provider_id);

      const reviewer = await get('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
      const service = await get('SELECT title FROM services WHERE id = ?', [order.service_id]);

      await createNotification({
        user_id: order.provider_id,
        type: 'review_new',
        title: prior ? 'Review updated' : 'New review received',
        body: prior
          ? `${reviewer?.full_name ?? 'A user'} updated their review to ${rating} stars for "${service?.title ?? 'your service'}".`
          : `${reviewer?.full_name ?? 'A user'} left ${rating} stars for "${service?.title ?? 'your service'}".`,
        ref_id: order.service_id,
      });

      const review = await get(
        `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
         FROM reviews r JOIN users u ON u.id = r.reviewer_id
         WHERE r.id = ?`,
        [id]
      );

      const cycle = await completeArrangementCycleIfBothReviewed(req, order);

      return res.status(201).json({ ...review, ...cycle });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/reviews/customer — provider reviews a customer ─────────────────
router.post(
  '/customer',
  requireAuth,
  [
    body('order_id').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: COMMENT_MAX }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { order_id, rating, comment } = req.body;

      const order = await get('SELECT * FROM orders WHERE id = ?', [order_id]);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.provider_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the provider can review the customer' });
      }
      if (order.status !== 'completed') {
        return res.status(400).json({ error: 'Order is not yet completed' });
      }

      const existing = await get('SELECT id FROM user_reviews WHERE order_id = ?', [order_id]);
      if (existing) {
        return res.status(409).json({ error: 'Review already submitted for this order' });
      }

      const prior = await get(
        `SELECT ur.id FROM user_reviews ur
         JOIN orders o ON o.id = ur.order_id
         WHERE ur.reviewer_id = ? AND ur.reviewee_id = ? AND o.service_id = ?
         ORDER BY ur.created_at DESC LIMIT 1`,
        [req.user.id, order.buyer_id, order.service_id]
      );

      let id;
      if (prior) {
        id = prior.id;
        await run(
          'UPDATE user_reviews SET order_id = ?, rating = ?, comment = ? WHERE id = ?',
          [order_id, rating, comment || null, id]
        );
      } else {
        id = uuidv4();
        await run(
          `INSERT INTO user_reviews (id, order_id, reviewer_id, reviewee_id, rating, comment)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, order_id, req.user.id, order.buyer_id, rating, comment || null]
        );
      }

      await recalcCustomerRating(order.buyer_id);

      const reviewer = await get('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
      const service = await get('SELECT title FROM services WHERE id = ?', [order.service_id]);

      await createNotification({
        user_id: order.buyer_id,
        type: 'review_new',
        title: prior ? 'Review updated' : 'New review received',
        body: prior
          ? `${reviewer?.full_name ?? 'A provider'} updated their review to ${rating} stars after "${service?.title ?? 'a service'}".`
          : `${reviewer?.full_name ?? 'A provider'} left ${rating} stars after "${service?.title ?? 'a service'}".`,
        ref_id: order.buyer_id,
      });

      const review = await get(
        `SELECT ur.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar,
                s.title AS service_title
         FROM user_reviews ur
         JOIN users u ON u.id = ur.reviewer_id
         JOIN orders o ON o.id = ur.order_id
         JOIN services s ON s.id = o.service_id
         WHERE ur.id = ?`,
        [id]
      );

      const cycle = await completeArrangementCycleIfBothReviewed(req, order);

      return res.status(201).json({ ...review, ...cycle });
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

// ── GET /api/reviews/user/:id — reviews on a provider's services ─────────────
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

// ── GET /api/reviews/about-user/:id — reviews about a user as a customer ─────
router.get('/about-user/:id', async (req, res, next) => {
  try {
    const user = await get('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const reviews = await all(
      `SELECT ur.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar,
              s.title AS service_title
       FROM user_reviews ur
       JOIN users u ON u.id = ur.reviewer_id
       JOIN orders o ON o.id = ur.order_id
       JOIN services s ON s.id = o.service_id
       WHERE ur.reviewee_id = ?
       ORDER BY ur.created_at DESC`,
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

async function recalcCustomerRating(userId) {
  const row = await get(
    'SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM user_reviews WHERE reviewee_id = ?',
    [userId]
  );
  await run(
    'UPDATE users SET customer_rating = ?, customer_review_count = ? WHERE id = ?',
    [Math.round((row.avg || 0) * 10) / 10, row.cnt, userId]
  );
}

module.exports = router;
