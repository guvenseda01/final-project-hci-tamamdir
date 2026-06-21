const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const VALID_TARGET_TYPES = ['service', 'user', 'conversation'];
const VALID_REASONS = [
  'spam',
  'inappropriate',
  'scam',
  'harassment',
  'other',
];

async function validateTarget(targetType, targetId) {
  if (targetType === 'service') {
    return get('SELECT id FROM services WHERE id = ?', [targetId]);
  }
  if (targetType === 'user') {
    return get('SELECT id FROM users WHERE id = ? AND is_active = 1', [targetId]);
  }
  if (targetType === 'conversation') {
    return get('SELECT id FROM conversations WHERE id = ?', [targetId]);
  }
  return null;
}

// POST /api/reports
router.post(
  '/',
  requireAuth,
  [
    body('target_type').isIn(VALID_TARGET_TYPES),
    body('target_id').trim().notEmpty(),
    body('reason').isIn(VALID_REASONS),
    body('details').optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { target_type, target_id, reason, details } = req.body;

      if (target_type === 'user' && target_id === req.user.id) {
        return res.status(400).json({ error: 'You cannot report yourself' });
      }

      const target = await validateTarget(target_type, target_id);
      if (!target) return res.status(404).json({ error: 'Report target not found' });

      if (target_type === 'conversation') {
        const conv = await get(
          'SELECT participant_a, participant_b FROM conversations WHERE id = ?',
          [target_id]
        );
        if (conv.participant_a !== req.user.id && conv.participant_b !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      const id = uuidv4();
      await run(
        `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, req.user.id, target_type, target_id, reason, details?.trim() || null]
      );

      return res.status(201).json({ message: 'Report submitted', id });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
