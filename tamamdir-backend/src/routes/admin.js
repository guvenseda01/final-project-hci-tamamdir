const express = require('express');
const { param, body, validationResult } = require('express-validator');

const { all, get, run } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

const REASON_LABELS = {
  spam: 'Spam or misleading',
  inappropriate: 'Inappropriate content',
  scam: 'Scam or fraud',
  harassment: 'Harassment',
  other: 'Other',
};

// GET /api/admin/reports
router.get('/reports', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const reports = await all(
      `SELECT r.*,
              u.full_name AS reporter_name,
              u.email AS reporter_email,
              CASE r.target_type
                WHEN 'service' THEN (SELECT title FROM services WHERE id = r.target_id)
                WHEN 'user' THEN (SELECT full_name FROM users WHERE id = r.target_id)
                WHEN 'conversation' THEN (
                  SELECT COALESCE(c.last_message, 'Conversation')
                  FROM conversations c WHERE c.id = r.target_id
                )
              END AS target_label,
              CASE r.target_type
                WHEN 'user' THEN r.target_id
                WHEN 'service' THEN (SELECT provider_id FROM services WHERE id = r.target_id)
                WHEN 'conversation' THEN (
                  SELECT CASE
                    WHEN c.participant_a = r.reporter_id THEN c.participant_b
                    ELSE c.participant_a
                  END
                  FROM conversations c WHERE c.id = r.target_id
                )
              END AS target_user_id,
              CASE r.target_type
                WHEN 'service' THEN r.target_id
                ELSE NULL
              END AS target_service_id
       FROM reports r
       JOIN users u ON u.id = r.reporter_id
       ORDER BY r.created_at DESC`
    );

    return res.json(
      reports.map(r => ({
        ...r,
        reason_label: REASON_LABELS[r.reason] ?? r.reason,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/reports/:id
router.patch(
  '/reports/:id',
  requireAuth,
  requireAdmin,
  param('id').notEmpty(),
  body('status').isIn(['pending', 'reviewed', 'dismissed']),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const existing = await get('SELECT id FROM reports WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Report not found' });

      await run('UPDATE reports SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
      const updated = await get('SELECT * FROM reports WHERE id = ?', [req.params.id]);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/services/:id/hide
router.post(
  '/services/:id/hide',
  requireAuth,
  requireAdmin,
  param('id').notEmpty(),
  async (req, res, next) => {
    try {
      const service = await get('SELECT id, title FROM services WHERE id = ?', [req.params.id]);
      if (!service) return res.status(404).json({ error: 'Service not found' });

      await run('UPDATE services SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Service hidden from marketplace', id: service.id });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/users/:id/suspend
router.post(
  '/users/:id/suspend',
  requireAuth,
  requireAdmin,
  param('id').notEmpty(),
  async (req, res, next) => {
    try {
      const user = await get('SELECT id, full_name, is_admin FROM users WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.is_admin) return res.status(400).json({ error: 'Cannot suspend an admin account' });

      await run('UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
      await run(
        'UPDATE services SET is_active = 0, updated_at = NOW() WHERE provider_id = ? AND is_active = 1',
        [req.params.id]
      );
      return res.json({ message: 'User suspended', id: user.id });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/users/:id/unsuspend
router.post(
  '/users/:id/unsuspend',
  requireAuth,
  requireAdmin,
  param('id').notEmpty(),
  async (req, res, next) => {
    try {
      const user = await get('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (!user) return res.status(404).json({ error: 'User not found' });

      await run('UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?', [req.params.id]);
      return res.json({ message: 'User reactivated', id: user.id });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
