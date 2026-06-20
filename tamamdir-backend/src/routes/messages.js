/**
 * @swagger
 * tags:
 *   - name: Messages
 *     description: Messaging and conversations
 */

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: List my conversations
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   other_name:
 *                     type: string
 *                   other_avatar:
 *                     type: string
 *                   last_message:
 *                     type: string
 *                   unread_count:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags: [Messages]
 *     summary: Start or get conversation
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation created or retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/messages/conversations/{id}:
 *   get:
 *     tags: [Messages]
 *     summary: Get conversation messages
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
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   sender_id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   is_read:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *   post:
 *     tags: [Messages]
 *     summary: Send message
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */

/**
 * @swagger
 * /api/messages/conversations/{id}/read:
 *   patch:
 *     tags: [Messages]
 *     summary: Mark conversation as read
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
 *         description: Marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get, all } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

async function getConversationForUser(convId, userId) {
  const conv = await get('SELECT * FROM conversations WHERE id = ?', [convId]);
  if (!conv) return null;
  const isParticipant = conv.participant_a === userId || conv.participant_b === userId;
  return isParticipant ? conv : null;
}

async function linkServiceToConversation(conv, serviceId, userId) {
  if (!serviceId) return conv;

  const service = await get('SELECT id, provider_id FROM services WHERE id = ?', [serviceId]);
  if (!service) {
    const err = new Error('Service not found');
    err.status = 404;
    throw err;
  }

  const otherId = conv.participant_a === userId ? conv.participant_b : conv.participant_a;
  if (service.provider_id !== userId && service.provider_id !== otherId) {
    const err = new Error('Service is not part of this conversation');
    err.status = 400;
    throw err;
  }

  await run('UPDATE conversations SET service_id = ? WHERE id = ?', [serviceId, conv.id]);
  return get('SELECT * FROM conversations WHERE id = ?', [conv.id]);
}

// ── GET /api/messages/conversations ─────────────────────────────────────────
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const convs = await all(
      `SELECT c.*,
              CASE WHEN c.participant_a = ? THEN u_b.full_name  ELSE u_a.full_name  END AS other_name,
              CASE WHEN c.participant_a = ? THEN u_b.avatar_url ELSE u_a.avatar_url END AS other_avatar,
              CASE WHEN c.participant_a = ? THEN c.participant_b ELSE c.participant_a END AS other_id,
              svc.title AS service_title,
              svc.price AS service_price,
              svc.price_unit AS service_price_unit,
              (SELECT COUNT(*) FROM messages m
               WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_id != ?) AS unread_count
       FROM conversations c
       JOIN users u_a ON u_a.id = c.participant_a
       JOIN users u_b ON u_b.id = c.participant_b
       LEFT JOIN services svc ON svc.id = c.service_id
       WHERE c.participant_a = ? OR c.participant_b = ?
       ORDER BY c.last_msg_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );
    return res.json(convs);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/messages/conversations ────────────────────────────────────────
// Body: { recipient_id, service_id? }
router.post(
  '/conversations',
  requireAuth,
  [body('recipient_id').notEmpty(), body('service_id').optional().notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { recipient_id, service_id } = req.body;
      if (recipient_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot message yourself' });
      }

      const recipient = await get('SELECT id FROM users WHERE id = ?', [recipient_id]);
      if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

      // Canonical order: lower UUID first
      const [a, b] = [req.user.id, recipient_id].sort();

      let conv = await get(
        'SELECT * FROM conversations WHERE participant_a = ? AND participant_b = ?',
        [a, b]
      );

      if (!conv) {
        const id = uuidv4();
        await run(
          'INSERT INTO conversations (id, participant_a, participant_b) VALUES (?, ?, ?)',
          [id, a, b]
        );
        conv = await get('SELECT * FROM conversations WHERE id = ?', [id]);
      }

      if (service_id) {
        conv = await linkServiceToConversation(conv, service_id, req.user.id);
      }

      return res.status(201).json(conv);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  }
);

// ── PATCH /api/messages/conversations/:id ───────────────────────────────────
// Body: { service_id }
router.patch(
  '/conversations/:id',
  requireAuth,
  [body('service_id').notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const conv = await getConversationForUser(req.params.id, req.user.id);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      const updated = await linkServiceToConversation(conv, req.body.service_id, req.user.id);
      return res.json(updated);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  }
);

// ── GET /api/messages/conversations/:id ─────────────────────────────────────
router.get('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const conv = await get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const isParticipant = conv.participant_a === req.user.id || conv.participant_b === req.user.id;
    if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

    const { before, limit = 50 } = req.query;
    const params = [req.params.id];
    let dateClause = '';

    if (before) {
      dateClause = 'AND m.created_at < ?';
      params.push(before);
    }

    const messages = await all(
      `SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ? ${dateClause}
       ORDER BY m.created_at DESC LIMIT ?`,
      [...params, parseInt(limit)]
    );

    // Mark messages from other party as read
    await run(
      `UPDATE messages SET is_read = 1
       WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
      [req.params.id, req.user.id]
    );

    return res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
});

// ── POST /api/messages/conversations/:id ────────────────────────────────────
router.post(
  '/conversations/:id',
  requireAuth,
  [body('content').trim().notEmpty().isLength({ max: 2000 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const conv = await get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      const isParticipant = conv.participant_a === req.user.id || conv.participant_b === req.user.id;
      if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

      try {
        await assertCustomerCanMessage(conv, req.user.id);
      } catch (err) {
        if (err.status === 403) {
          return res.status(403).json({ error: err.message, ...(err.meta ?? {}) });
        }
        throw err;
      }

      const msgId = uuidv4();
      await run(
        'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)',
        [msgId, req.params.id, req.user.id, req.body.content]
      );

      // Update conversation last message
      await run(
        `UPDATE conversations SET last_message = ?, last_msg_at = NOW() WHERE id = ?`,
        [req.body.content.slice(0, 100), req.params.id]
      );

      const message = await get(
        `SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_avatar
         FROM messages m JOIN users u ON u.id = m.sender_id
         WHERE m.id = ?`,
        [msgId]
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`conv:${req.params.id}`).emit('message:new', message);
        const recipientId = conv.participant_a === req.user.id
          ? conv.participant_b
          : conv.participant_a;
        io.to(`user:${recipientId}`).emit('conversation:updated', {
          id: req.params.id,
          last_message: req.body.content.slice(0, 100),
          last_msg_at: message.created_at,
        });
      }

      return res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/messages/conversations/:id/read ──────────────────────────────
router.patch('/conversations/:id/read', requireAuth, async (req, res, next) => {
  try {
    await run(
      `UPDATE messages SET is_read = 1
       WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
      [req.params.id, req.user.id]
    );
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

// ── Helpers: Tamamdır dual-confirm ───────────────────────────────────────────

async function finalizeTamamdirOrder(conversationId, serviceId) {
  const conv = await get('SELECT * FROM conversations WHERE id = ?', [conversationId]);
  const service = await get(
    'SELECT id, provider_id, price, title, is_active FROM services WHERE id = ?',
    [serviceId]
  );
  if (!conv || !service || !service.is_active) return null;

  const isParticipant =
    conv.participant_a === service.provider_id ||
    conv.participant_b === service.provider_id;
  if (!isParticipant) return null;

  const buyerId = service.provider_id === conv.participant_a
    ? conv.participant_b
    : conv.participant_a;

  let order = await get(
    `SELECT * FROM orders
     WHERE service_id = ? AND buyer_id = ? AND provider_id = ?
       AND status IN ('pending', 'accepted', 'in_progress', 'completed')
     ORDER BY created_at DESC LIMIT 1`,
    [serviceId, buyerId, service.provider_id]
  );

  if (order && order.status === 'pending') {
    await run(
      "UPDATE orders SET status = 'accepted', updated_at = NOW() WHERE id = ?",
      [order.id]
    );
  } else if (!order) {
    const id = uuidv4();
    await run(
      `INSERT INTO orders (id, service_id, buyer_id, provider_id, status, price_at_order)
       VALUES (?, ?, ?, ?, 'accepted', ?)`,
      [id, serviceId, buyerId, service.provider_id, service.price]
    );
    order = await get('SELECT * FROM orders WHERE id = ?', [id]);
  }

  return order;
}

function emitTamamdirUpdate(req, conversationId, payload) {
  const io = req.app.get('io');
  if (!io) return;
  io.to(`conv:${conversationId}`).emit('tamamdir:update', payload);
}

const TAMAMDIR_CANCEL_LIMIT = 2;
const TAMAMDIR_BAN_DAYS = 7;

function getBuyerId(conv, providerId) {
  return providerId === conv.participant_a ? conv.participant_b : conv.participant_a;
}

async function getArrangement(conversationId, serviceId) {
  let row = await get(
    'SELECT * FROM conversation_service_arrangements WHERE conversation_id = ? AND service_id = ?',
    [conversationId, serviceId]
  );

  if (!row) {
    return {
      cancel_count: 0,
      customer_cancel_count: 0,
      provider_cancel_count: 0,
      banned_until: null,
      banned_user_id: null,
    };
  }

  row.customer_cancel_count = row.customer_cancel_count ?? row.cancel_count ?? 0;
  row.provider_cancel_count = row.provider_cancel_count ?? 0;

  if (row.banned_until && new Date(row.banned_until) <= new Date()) {
    await run(
      `UPDATE conversation_service_arrangements
       SET cancel_count = 0,
           customer_cancel_count = 0,
           provider_cancel_count = 0,
           banned_until = NULL,
           banned_user_id = NULL,
           updated_at = NOW()
       WHERE conversation_id = ? AND service_id = ?`,
      [conversationId, serviceId]
    );
    return {
      cancel_count: 0,
      customer_cancel_count: 0,
      provider_cancel_count: 0,
      banned_until: null,
      banned_user_id: null,
    };
  }

  return row;
}

function buildArrangementMeta(arrangement, buyerId, providerId, userId) {
  const customerCancels = arrangement.customer_cancel_count ?? arrangement.cancel_count ?? 0;
  const providerCancels = arrangement.provider_cancel_count ?? 0;
  const isCustomer = userId === buyerId;
  const isBanned =
    arrangement.banned_until != null &&
    arrangement.banned_user_id != null &&
    new Date(arrangement.banned_until) > new Date();

  return {
    cancel_count: customerCancels,
    customer_cancel_count: customerCancels,
    provider_cancel_count: providerCancels,
    cancel_limit: TAMAMDIR_CANCEL_LIMIT,
    is_customer: isCustomer,
    my_cancel_count: isCustomer ? customerCancels : providerCancels,
    my_cancels_remaining: isCustomer
      ? Math.max(0, TAMAMDIR_CANCEL_LIMIT - customerCancels)
      : null,
    will_be_banned_if_cancel: isCustomer && customerCancels >= TAMAMDIR_CANCEL_LIMIT - 1,
    is_banned: isBanned,
    banned_until: isBanned ? arrangement.banned_until : null,
    banned_user_id: isBanned ? arrangement.banned_user_id : null,
    i_am_banned: isBanned && arrangement.banned_user_id === userId,
    can_unban: isBanned && userId === providerId && arrangement.banned_user_id === buyerId,
    buyer_id: buyerId,
    provider_id: providerId,
  };
}

async function incrementCancelAndMaybeBan(
  conversationId,
  serviceId,
  buyerId,
  providerId,
  cancelledByUserId
) {
  await run(
    `INSERT INTO conversation_service_arrangements (conversation_id, service_id)
     VALUES (?, ?)
     ON CONFLICT (conversation_id, service_id) DO NOTHING`,
    [conversationId, serviceId]
  );

  const isCustomerCancel = cancelledByUserId === buyerId;

  if (isCustomerCancel) {
    const row = await get(
      'SELECT * FROM conversation_service_arrangements WHERE conversation_id = ? AND service_id = ?',
      [conversationId, serviceId]
    );
    const customerCancels = (row?.customer_cancel_count ?? row?.cancel_count ?? 0) + 1;

    await run(
      `UPDATE conversation_service_arrangements
       SET customer_cancel_count = ?,
           cancel_count = ?,
           updated_at = NOW()
       WHERE conversation_id = ? AND service_id = ?`,
      [customerCancels, customerCancels, conversationId, serviceId]
    );

    if (customerCancels >= TAMAMDIR_CANCEL_LIMIT) {
      await run(
        `UPDATE conversation_service_arrangements
         SET banned_until = NOW() + INTERVAL '${TAMAMDIR_BAN_DAYS} days',
             banned_user_id = ?,
             updated_at = NOW()
         WHERE conversation_id = ? AND service_id = ?`,
        [buyerId, conversationId, serviceId]
      );
    }

    return get(
      'SELECT * FROM conversation_service_arrangements WHERE conversation_id = ? AND service_id = ?',
      [conversationId, serviceId]
    );
  }

  if (cancelledByUserId === providerId) {
    await run(
      `UPDATE conversation_service_arrangements
       SET provider_cancel_count = COALESCE(provider_cancel_count, 0) + 1,
           updated_at = NOW()
       WHERE conversation_id = ? AND service_id = ?`,
      [conversationId, serviceId]
    );
  }

  return get(
    'SELECT * FROM conversation_service_arrangements WHERE conversation_id = ? AND service_id = ?',
    [conversationId, serviceId]
  );
}

async function clearCustomerBan(conversationId, serviceId) {
  await run(
    `UPDATE conversation_service_arrangements
     SET banned_until = NULL,
         banned_user_id = NULL,
         customer_cancel_count = 0,
         cancel_count = 0,
         updated_at = NOW()
     WHERE conversation_id = ? AND service_id = ?`,
    [conversationId, serviceId]
  );
  return get(
    'SELECT * FROM conversation_service_arrangements WHERE conversation_id = ? AND service_id = ?',
    [conversationId, serviceId]
  );
}

function buildTamamdirPayload(base, arrangement, buyerId, providerId, userId) {
  const meta = buildArrangementMeta(arrangement, buyerId, providerId, userId);
  return { ...base, ...meta };
}

async function assertCustomerCanMessage(conv, userId) {
  const bannedRow = await get(
    `SELECT csa.service_id, s.provider_id, csa.banned_until
     FROM conversation_service_arrangements csa
     JOIN services s ON s.id = csa.service_id
     WHERE csa.conversation_id = ?
       AND csa.banned_user_id = ?
       AND csa.banned_until IS NOT NULL
       AND csa.banned_until > NOW()
     LIMIT 1`,
    [conv.id, userId]
  );

  if (bannedRow) {
    const arrangement = await getArrangement(conv.id, bannedRow.service_id);
    const buyerId = getBuyerId(conv, bannedRow.provider_id);
    const meta = buildArrangementMeta(arrangement, buyerId, bannedRow.provider_id, userId);
    const err = new Error('You are banned from this service');
    err.status = 403;
    err.meta = meta;
    throw err;
  }

  const serviceId = conv.service_id;
  if (!serviceId) return;

  const service = await get('SELECT id, provider_id FROM services WHERE id = ?', [serviceId]);
  if (!service) return;

  const buyerId = getBuyerId(conv, service.provider_id);
  if (userId !== buyerId) return;

  const arrangement = await getArrangement(conv.id, serviceId);
  const meta = buildArrangementMeta(arrangement, buyerId, service.provider_id, userId);
  if (meta.i_am_banned) {
    const err = new Error('You are banned from this service');
    err.status = 403;
    err.meta = meta;
    throw err;
  }
}

// ── GET /api/messages/conversations/:id/tamamdir ────────────────────────────
router.get('/conversations/:id/tamamdir', requireAuth, async (req, res, next) => {
  try {
    const { service_id } = req.query;
    if (!service_id) return res.status(422).json({ error: 'service_id is required' });

    const conv = await get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const isParticipant =
      conv.participant_a === req.user.id || conv.participant_b === req.user.id;
    if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

    const otherId = conv.participant_a === req.user.id
      ? conv.participant_b
      : conv.participant_a;

    const confirms = await all(
      'SELECT user_id FROM conversation_tamamdir WHERE conversation_id = ? AND service_id = ?',
      [req.params.id, service_id]
    );
    const confirmedIds = confirms.map(c => c.user_id);

    const service = await get(
      'SELECT id, provider_id, title FROM services WHERE id = ?',
      [service_id]
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const buyerId = service.provider_id === conv.participant_a
      ? conv.participant_b
      : conv.participant_a;

    const order = await get(
      `SELECT o.id, o.status
       FROM orders o
       WHERE o.service_id = ? AND o.buyer_id = ? AND o.provider_id = ?
         AND o.status IN ('pending', 'accepted', 'in_progress', 'completed')
       ORDER BY o.created_at DESC LIMIT 1`,
      [service_id, buyerId, service.provider_id]
    );

    const bothConfirmed = confirmedIds.length >= 2;
    const arrangement = await getArrangement(req.params.id, service_id);

    return res.json(buildTamamdirPayload({
      service_id,
      service_title: service?.title ?? null,
      my_confirmed: confirmedIds.includes(req.user.id),
      other_confirmed: confirmedIds.includes(otherId),
      both_confirmed: bothConfirmed,
      order_id: bothConfirmed ? (order?.id ?? null) : null,
      order_status: bothConfirmed ? (order?.status ?? null) : null,
    }, arrangement, buyerId, service.provider_id, req.user.id));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/messages/conversations/:id/tamamdir ───────────────────────────
router.post(
  '/conversations/:id/tamamdir',
  requireAuth,
  [body('service_id').notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { service_id } = req.body;
      const conv = await get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      const isParticipant =
        conv.participant_a === req.user.id || conv.participant_b === req.user.id;
      if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

      const service = await get(
        'SELECT id, provider_id, price, title, is_active FROM services WHERE id = ?',
        [service_id]
      );
      if (!service || !service.is_active) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const inConv =
        conv.participant_a === service.provider_id ||
        conv.participant_b === service.provider_id;
      if (!inConv) {
        return res.status(400).json({ error: 'Service provider is not in this conversation' });
      }

      const buyerId = getBuyerId(conv, service.provider_id);
      const arrangement = await getArrangement(req.params.id, service_id);
      const banMeta = buildArrangementMeta(arrangement, buyerId, service.provider_id, req.user.id);
      if (banMeta.i_am_banned) {
        return res.status(403).json({
          error: 'You are banned from this service',
          ...banMeta,
          service_id,
          service_title: service.title,
        });
      }

      await run(
        `INSERT INTO conversation_tamamdir (conversation_id, service_id, user_id)
         VALUES (?, ?, ?) ON CONFLICT DO NOTHING`,
        [req.params.id, service_id, req.user.id]
      );

      const confirms = await all(
        'SELECT user_id FROM conversation_tamamdir WHERE conversation_id = ? AND service_id = ?',
        [req.params.id, service_id]
      );

      const otherId = conv.participant_a === req.user.id
        ? conv.participant_b
        : conv.participant_a;

      let order = null;
      if (confirms.length >= 2) {
        order = await finalizeTamamdirOrder(req.params.id, service_id);
      }

      const confirmedUserIds = confirms.map(c => c.user_id);
      const freshArrangement = await getArrangement(req.params.id, service_id);
      const payload = buildTamamdirPayload({
        conversation_id: req.params.id,
        service_id,
        service_title: service.title,
        confirmed_user_ids: confirmedUserIds,
        both_confirmed: confirms.length >= 2,
        order_id: order?.id ?? null,
        order_status: order?.status ?? null,
      }, freshArrangement, buyerId, service.provider_id, req.user.id);

      emitTamamdirUpdate(req, req.params.id, payload);

      return res.json({
        ...payload,
        my_confirmed: confirmedUserIds.includes(req.user.id),
        other_confirmed: confirmedUserIds.includes(otherId),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/messages/conversations/:id/tamamdir/cancel ────────────────────
router.post(
  '/conversations/:id/tamamdir/cancel',
  requireAuth,
  [body('service_id').notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { service_id } = req.body;
      const conv = await get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      const isParticipant =
        conv.participant_a === req.user.id || conv.participant_b === req.user.id;
      if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

      const service = await get(
        'SELECT id, provider_id, title FROM services WHERE id = ?',
        [service_id]
      );
      if (!service) return res.status(404).json({ error: 'Service not found' });

      const otherId = conv.participant_a === req.user.id
        ? conv.participant_b
        : conv.participant_a;

      const buyerId = getBuyerId(conv, service.provider_id);

      await run(
        'DELETE FROM conversation_tamamdir WHERE conversation_id = ? AND service_id = ?',
        [req.params.id, service_id]
      );

      const order = await get(
        `SELECT o.id, o.status
         FROM orders o
         WHERE o.service_id = ? AND o.buyer_id = ? AND o.provider_id = ?
           AND o.status IN ('pending', 'accepted', 'in_progress')
         ORDER BY o.created_at DESC LIMIT 1`,
        [service_id, buyerId, service.provider_id]
      );

      if (order && ['pending', 'accepted', 'in_progress'].includes(order.status)) {
        await run(
          `UPDATE orders
           SET status = 'cancelled', cancelled_at = NOW(),
               cancel_reason = 'Cancelled from chat', updated_at = NOW()
           WHERE id = ?`,
          [order.id]
        );
      }

      const arrangement = await incrementCancelAndMaybeBan(
        req.params.id,
        service_id,
        buyerId,
        service.provider_id,
        req.user.id
      );

      const payload = buildTamamdirPayload({
        conversation_id: req.params.id,
        service_id,
        service_title: service.title,
        confirmed_user_ids: [],
        both_confirmed: false,
        order_id: null,
        order_status: null,
      }, arrangement, buyerId, service.provider_id, req.user.id);

      emitTamamdirUpdate(req, req.params.id, payload);

      return res.json({
        ...payload,
        my_confirmed: false,
        other_confirmed: false,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/messages/conversations/:id/tamamdir/unban ─────────────────────
router.post(
  '/conversations/:id/tamamdir/unban',
  requireAuth,
  [body('service_id').notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { service_id } = req.body;
      const conv = await get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      const service = await get(
        'SELECT id, provider_id, title FROM services WHERE id = ?',
        [service_id]
      );
      if (!service) return res.status(404).json({ error: 'Service not found' });

      if (req.user.id !== service.provider_id) {
        return res.status(403).json({ error: 'Only the service provider can remove a ban' });
      }

      const buyerId = getBuyerId(conv, service.provider_id);
      const arrangement = await clearCustomerBan(req.params.id, service_id);

      const payload = buildTamamdirPayload({
        conversation_id: req.params.id,
        service_id,
        service_title: service.title,
        confirmed_user_ids: [],
        both_confirmed: false,
        order_id: null,
        order_status: null,
      }, arrangement, buyerId, service.provider_id, req.user.id);

      emitTamamdirUpdate(req, req.params.id, payload);

      return res.json({
        ...payload,
        my_confirmed: false,
        other_confirmed: false,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
