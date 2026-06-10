/**
 * /api/orders
 *
 * POST   /               – place an order (buyer)
 * GET    /               – list my orders (auth, ?role=buyer|provider)
 * GET    /:id            – get single order (auth, own only)
 * PATCH  /:id/accept     – provider accepts
 * PATCH  /:id/start      – provider starts work → in_progress
 * PATCH  /:id/complete   – provider marks done → completed
 * PATCH  /:id/cancel     – buyer or provider cancels
 */
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get, all } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const VALID_TRANSITIONS = {
  pending:     ['accepted', 'cancelled'],
  accepted:    ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
};

// ── POST /api/orders ─────────────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  [
    body('service_id').notEmpty(),
    body('note').optional().isLength({ max: 500 }),
    body('scheduled_at').optional().isISO8601(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { service_id, note, scheduled_at } = req.body;

      const service = await get(
        'SELECT id, provider_id, price, is_active FROM services WHERE id = ?',
        [service_id]
      );
      if (!service || !service.is_active) return res.status(404).json({ error: 'Service not found' });
      if (service.provider_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot order your own service' });
      }

      const id = uuidv4();
      await run(
        `INSERT INTO orders (id, service_id, buyer_id, provider_id, price_at_order, note, scheduled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, service_id, req.user.id, service.provider_id, service.price, note || null, scheduled_at || null]
      );

      // Notify provider
      await createNotification({
        user_id: service.provider_id,
        type:    'order_new',
        title:   'New order received!',
        body:    'Someone placed an order for your service.',
        ref_id:  id,
      });

      const order = await getFullOrder(id);
      return res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/orders ──────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { role = 'buyer', status } = req.query;
    const field = role === 'provider' ? 'o.provider_id' : 'o.buyer_id';

    const where  = [`${field} = ?`];
    const params = [req.user.id];

    if (status) {
      where.push('o.status = ?');
      params.push(status);
    }

    const orders = await all(
      `SELECT o.*,
              s.title AS service_title,
              u_b.full_name AS buyer_name,    u_b.avatar_url AS buyer_avatar,
              u_p.full_name AS provider_name, u_p.avatar_url AS provider_avatar
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN users u_b  ON u_b.id = o.buyer_id
       JOIN users u_p  ON u_p.id = o.provider_id
       WHERE ${where.join(' AND ')}
       ORDER BY o.created_at DESC`,
      params
    );

    return res.json(orders);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await getFullOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.buyer_id !== req.user.id && order.provider_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json(order);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/orders/:id/accept ─────────────────────────────────────────────
router.patch('/:id/accept', requireAuth, async (req, res, next) => {
  return transitionOrder(req, res, next, 'accepted', (o) => o.provider_id === req.user.id);
});

// ── PATCH /api/orders/:id/start ──────────────────────────────────────────────
router.patch('/:id/start', requireAuth, async (req, res, next) => {
  return transitionOrder(req, res, next, 'in_progress', (o) => o.provider_id === req.user.id);
});

// ── PATCH /api/orders/:id/complete ───────────────────────────────────────────
router.patch('/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.provider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (order.status !== 'in_progress') {
      return res.status(400).json({ error: `Cannot complete an order with status "${order.status}"` });
    }

    await run(
      `UPDATE orders
       SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [order.id]
    );

    // Credit provider wallet
    await run(
      'UPDATE users SET total_earnings = total_earnings + ?, wallet_balance = wallet_balance + ? WHERE id = ?',
      [order.price_at_order, order.price_at_order, order.provider_id]
    );

    // Increment service order count
    await run('UPDATE services SET order_count = order_count + 1 WHERE id = ?', [order.service_id]);

    // Notify buyer to leave a review
    await createNotification({
      user_id: order.buyer_id,
      type:    'order_completed',
      title:   'Your order is complete! 🎉',
      body:    'Please leave a review for the service.',
      ref_id:  order.id,
    });

    const updated = await getFullOrder(order.id);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/orders/:id/cancel ─────────────────────────────────────────────
router.patch(
  '/:id/cancel',
  requireAuth,
  [body('reason').optional().isLength({ max: 300 })],
  async (req, res, next) => {
    try {
      const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isParty = order.buyer_id === req.user.id || order.provider_id === req.user.id;
      if (!isParty) return res.status(403).json({ error: 'Forbidden' });

      const allowed = VALID_TRANSITIONS[order.status] || [];
      if (!allowed.includes('cancelled')) {
        return res.status(400).json({ error: `Cannot cancel an order with status "${order.status}"` });
      }

      await run(
        `UPDATE orders
         SET status = 'cancelled', cancelled_at = datetime('now'),
             cancel_reason = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [req.body.reason || null, order.id]
      );

      const other = order.buyer_id === req.user.id ? order.provider_id : order.buyer_id;
      await createNotification({
        user_id: other,
        type:    'order_cancelled',
        title:   'An order was cancelled',
        body:    req.body.reason || 'No reason provided.',
        ref_id:  order.id,
      });

      const updated = await getFullOrder(order.id);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── Helpers ──────────────────────────────────────────────────────────────────
async function transitionOrder(req, res, next, newStatus, authCheck) {
  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!authCheck(order)) return res.status(403).json({ error: 'Forbidden' });

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({ error: `Cannot move to "${newStatus}" from "${order.status}"` });
    }

    await run(
      `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [newStatus, order.id]
    );

    await createNotification({
      user_id: order.buyer_id,
      type:    `order_${newStatus}`,
      title:   `Order ${newStatus}`,
      body:    `Your order status changed to "${newStatus}".`,
      ref_id:  order.id,
    });

    const updated = await getFullOrder(order.id);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function getFullOrder(id) {
  return get(
    `SELECT o.*,
            s.title AS service_title, s.price AS service_price,
            u_b.full_name AS buyer_name,    u_b.avatar_url AS buyer_avatar,
            u_p.full_name AS provider_name, u_p.avatar_url AS provider_avatar
     FROM orders o
     JOIN services s ON s.id = o.service_id
     JOIN users u_b  ON u_b.id = o.buyer_id
     JOIN users u_p  ON u_p.id = o.provider_id
     WHERE o.id = ?`,
    [id]
  );
}

async function createNotification({ user_id, type, title, body, ref_id }) {
  await run(
    'INSERT INTO notifications (id, user_id, type, title, body, ref_id) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), user_id, type, title, body || null, ref_id || null]
  );
}

module.exports = router;
