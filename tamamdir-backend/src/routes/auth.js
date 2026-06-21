/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 needs_interests:
 *                   type: boolean
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user info
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info with interests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     interests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get } = require('../config/database');
const { signToken, requireAuth } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');
const { isIyteStudentEmail, isAdminEmail, sanitizeUser } = require('../utils/user');
const {
  generateCode,
  hashCode,
  getExpiryDate,
  isExpired,
  CODE_TTL_MINUTES,
} = require('../services/verification');

// Keep Gmail dots — Resend test mode matches the exact account email
const EMAIL_NORM = { gmail_remove_dots: false, gmail_remove_subaddress: false };

async function buildAuthProfile(user, { includeInterests = false } = {}) {
  const [completedRow, activeRow] = await Promise.all([
    get(
      `SELECT COUNT(*) AS n FROM orders WHERE provider_id = ? AND status = 'completed'`,
      [user.id]
    ),
    get(
      `SELECT COUNT(*) AS n FROM services WHERE provider_id = ? AND is_active = 1`,
      [user.id]
    ),
  ]);

  const profile = {
    ...sanitizeUser(user),
    completed_orders: parseInt(completedRow?.n ?? 0, 10),
    active_services: parseInt(activeRow?.n ?? 0, 10),
  };

  if (includeInterests) {
    profile.interests = await require('../config/database').all(
      `SELECT c.id, c.name, c.icon, c.slug
       FROM user_interests ui
       JOIN categories c ON c.id = ui.category_id
       WHERE ui.user_id = ?`,
      [user.id]
    );
  }

  return profile;
}

async function createAndSendVerificationCode(user) {
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = getExpiryDate();

  await run('DELETE FROM email_verifications WHERE user_id = ?', [user.id]);
  await run(
    `INSERT INTO email_verifications (id, user_id, code_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [uuidv4(), user.id, codeHash, expiresAt.toISOString()]
  );

  await sendVerificationEmail(user.email, code);
  return code;
}

async function createAndSendPasswordResetCode(user) {
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = getExpiryDate();

  await run('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
  await run(
    `INSERT INTO password_resets (id, user_id, code_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [uuidv4(), user.id, codeHash, expiresAt.toISOString()]
  );

  await sendPasswordResetEmail(user.email, code);
  return code;
}

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email')
      .trim()
      .isEmail().withMessage('Valid e-mail required')
      .normalizeEmail(EMAIL_NORM),
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

      // All new accounts require email verification
      const id           = uuidv4();
      const passwordHash = await bcrypt.hash(password, 12);
      const isVerifiedStudent = isIyteStudentEmail(email) ? 1 : 0;
      const isAdmin = isAdminEmail(email) ? 1 : 0;

      await run(
        `INSERT INTO users (id, full_name, email, password_hash, is_verified, is_verified_student, is_admin)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [id, full_name, email, passwordHash, isVerifiedStudent, isAdmin]
      );

      const user = await get('SELECT * FROM users WHERE id = ?', [id]);
      await createAndSendVerificationCode(user);

      return res.status(201).json({
        message: 'Verification code sent to your email',
        email: user.email,
        needs_verification: true,
        expires_in_minutes: CODE_TTL_MINUTES,
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
    body('email').trim().isEmail().normalizeEmail(EMAIL_NORM),
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

      if (!user.is_verified) {
        return res.status(403).json({
          error: 'Email not verified',
          needs_verification: true,
          email: user.email,
        });
      }

      if (user.deleted_at) {
        return res.status(403).json({ error: 'This account has been deleted' });
      }

      const token = signToken({ id: user.id, email: user.email });
      const profile = await buildAuthProfile(user);
      return res.json({ token, user: profile });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/verify-email ───────────────────────────────────────────────
router.post(
  '/verify-email',
  [
    body('email').trim().isEmail().normalizeEmail(EMAIL_NORM),
    body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email, code } = req.body;
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.is_verified) {
        const token = signToken({ id: user.id, email: user.email });
        const profile = await buildAuthProfile(user);
        return res.json({
          message: 'Email already verified',
          token,
          user: profile,
          needs_interests: true,
        });
      }

      const record = await get(
        `SELECT * FROM email_verifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

      if (!record) {
        return res.status(400).json({ error: 'No verification code found. Please register again or resend.' });
      }

      if (isExpired(record.expires_at)) {
        return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
      }

      if (record.code_hash !== hashCode(code)) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      await run('UPDATE users SET is_verified = 1, updated_at = NOW() WHERE id = ?', [user.id]);
      await run('DELETE FROM email_verifications WHERE user_id = ?', [user.id]);

      const updated = await get('SELECT * FROM users WHERE id = ?', [user.id]);
      const token = signToken({ id: updated.id, email: updated.email });
      const profile = await buildAuthProfile(updated);

      return res.json({
        message: 'Email verified successfully',
        token,
        user: profile,
        needs_interests: true,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/resend-verification ──────────────────────────────────────
router.post(
  '/resend-verification',
  [body('email').trim().isEmail().normalizeEmail(EMAIL_NORM)],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.is_verified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      await createAndSendVerificationCode(user);

      return res.json({
        message: 'Verification code sent',
        email: user.email,
        expires_in_minutes: CODE_TTL_MINUTES,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post(
  '/forgot-password',
  [body('email').trim().isEmail().normalizeEmail(EMAIL_NORM)],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);

      if (user && user.is_verified && !user.deleted_at) {
        await createAndSendPasswordResetCode(user);
      }

      return res.json({
        message: 'If an account exists for this email, a reset code has been sent.',
        email,
        expires_in_minutes: CODE_TTL_MINUTES,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post(
  '/reset-password',
  [
    body('email').trim().isEmail().normalizeEmail(EMAIL_NORM),
    body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
    body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email, code, new_password } = req.body;
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user || user.deleted_at) {
        return res.status(400).json({ error: 'Invalid or expired reset code' });
      }

      const record = await get(
        `SELECT * FROM password_resets
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

      if (!record) {
        return res.status(400).json({ error: 'No reset code found. Please request a new one.' });
      }

      if (isExpired(record.expires_at)) {
        return res.status(400).json({ error: 'Reset code expired. Please request a new code.' });
      }

      if (record.code_hash !== hashCode(code)) {
        return res.status(400).json({ error: 'Invalid reset code' });
      }

      const passwordHash = await bcrypt.hash(new_password, 12);
      await run('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
        passwordHash,
        user.id,
      ]);
      await run('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

      return res.json({ message: 'Password reset successfully' });
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
    if (user.deleted_at) return res.status(403).json({ error: 'This account has been deleted' });

    return res.json(await buildAuthProfile(user, { includeInterests: true }));
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/auth/password ────────────────────────────────────────────────
router.patch(
  '/password',
  requireAuth,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (!user || user.deleted_at) return res.status(404).json({ error: 'User not found' });

      const valid = await bcrypt.compare(req.body.current_password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

      const passwordHash = await bcrypt.hash(req.body.new_password, 12);
      await run('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
        passwordHash,
        req.user.id,
      ]);

      return res.json({ message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/deactivate ─────────────────────────────────────────────────
router.post('/deactivate', requireAuth, async (req, res, next) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.deleted_at) return res.status(404).json({ error: 'User not found' });
    if (!user.is_active) return res.status(400).json({ error: 'Account is already deactivated' });

    await run('UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.user.id]);
    await run(
      'UPDATE services SET is_active = 0, updated_at = NOW() WHERE provider_id = ? AND is_active = 1',
      [req.user.id]
    );

    const updated = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    return res.json(sanitizeUser(updated));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/reactivate ───────────────────────────────────────────────
router.post('/reactivate', requireAuth, async (req, res, next) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.deleted_at) return res.status(404).json({ error: 'User not found' });
    if (user.is_active) return res.status(400).json({ error: 'Account is already active' });

    await run('UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?', [req.user.id]);
    await run(
      'UPDATE services SET is_active = 1, updated_at = NOW() WHERE provider_id = ?',
      [req.user.id]
    );

    const updated = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    return res.json(sanitizeUser(updated));
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/auth/account ────────────────────────────────────────────────
router.delete('/account', requireAuth, async (req, res, next) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.deleted_at) return res.status(404).json({ error: 'User not found' });

    await run(
      'UPDATE users SET is_active = 0, deleted_at = NOW(), updated_at = NOW() WHERE id = ?',
      [req.user.id]
    );
    await run(
      'UPDATE services SET is_active = 0, updated_at = NOW() WHERE provider_id = ?',
      [req.user.id]
    );

    return res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
