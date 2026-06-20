/**
 * /api/auth
 *
 * POST /register  – create account
 * POST /login     – issue JWT
 * GET  /me        – current user info
 */
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get } = require('../config/database');
const { signToken, requireAuth } = require('../middleware/auth');

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email')
      .trim()
      .isEmail().withMessage('Valid e-mail required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { full_name, email, password } = req.body;

      const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) {
        return res.status(409).json({ error: 'E-mail already registered' });
      }

      // Auto-verify IYTE university emails
      const isVerified = email.endsWith('@iyte.edu.tr') || email.endsWith('@std.iyte.edu.tr') ? 1 : 0;

      const id           = uuidv4();
      const passwordHash = await bcrypt.hash(password, 12);

      await run(
        `INSERT INTO users (id, full_name, email, password_hash, is_verified)
         VALUES (?, ?, ?, ?, ?)`,
        [id, full_name, email, passwordHash, isVerified]
      );

      const user  = await get('SELECT * FROM users WHERE id = ?', [id]);
      const token = signToken({ id: user.id, email: user.email });

      return res.status(201).json({
        token,
        user: sanitizeUser(user),
        needs_interests: true, // prompt the interests-selection screen
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').trim().isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = signToken({ id: user.id, email: user.email });
      return res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Include interests
    const interests = await require('../config/database').all(
      `SELECT c.id, c.name, c.icon, c.slug
       FROM user_interests ui
       JOIN categories c ON c.id = ui.category_id
       WHERE ui.user_id = ?`,
      [user.id]
    );

    return res.json({ ...sanitizeUser(user), interests });
  } catch (err) {
    next(err);
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = router;
