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

// ── GET /api/messages/conversations ─────────────────────────────────────────
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const convs = await all(
      `SELECT c.*,
              CASE WHEN c.participant_a = ? THEN u_b.full_name  ELSE u_a.full_name  END AS other_name,
              CASE WHEN c.participant_a = ? THEN u_b.avatar_url ELSE u_a.avatar_url END AS other_avatar,
              CASE WHEN c.participant_a = ? THEN c.participant_b ELSE c.participant_a END AS other_id,
              (SELECT COUNT(*) FROM messages m
               WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_id != ?) AS unread_count
       FROM conversations c
       JOIN users u_a ON u_a.id = c.participant_a
       JOIN users u_b ON u_b.id = c.participant_b
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
// Body: { recipient_id }
router.post(
  '/conversations',
  requireAuth,
  [body('recipient_id').notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { recipient_id } = req.body;
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

      return res.status(201).json(conv);
    } catch (err) {
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

module.exports = router;
