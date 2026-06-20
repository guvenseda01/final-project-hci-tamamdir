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
const crypto  = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { run, get, all } = require('../config/database');
const { signToken, requireAuth } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Rate limiter for resend-verification: user_id -> last request timestamp
const resendVerificationLimiter = new Map();

// Rate limiter for forgot-password: 5 requests per 15 minutes per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many password reset requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

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

      // Generate and store email verification token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      await run(
        `INSERT INTO email_tokens (user_id, token_hash, type, expires_at)
         VALUES (?, ?, ?, ?)`,
        [id, tokenHash, 'verify', expiresAt.toISOString()]
      );

      // Send verification email
      const verifyUrl = `${FRONTEND_URL}/verify-email?token=${rawToken}`;
      try {
        await sendVerificationEmail(email, full_name, verifyUrl);
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr);
        // Don't fail the registration if email fails
      }

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

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Verify email with token
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Email verification token
 *     responses:
 *       302:
 *         description: Redirects to email-verified page on success
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// ── GET /api/auth/verify-email ──────────────────────────────────────────────
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date().toISOString();

    const emailToken = await get(
      `SELECT * FROM email_tokens
       WHERE token_hash = ? AND type = 'verify' AND used_at IS NULL AND expires_at > ?`,
      [tokenHash, now]
    );

    if (!emailToken) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark email as confirmed
    await run(
      `UPDATE users SET email_confirmed = TRUE WHERE id = ?`,
      [emailToken.user_id]
    );

    // Mark token as used
    await run(
      `UPDATE email_tokens SET used_at = ? WHERE id = ?`,
      [new Date().toISOString(), emailToken.id]
    );

    // Redirect to email-verified page
    return res.redirect(302, `${FRONTEND_URL}/email-verified`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent (or generic message if user not found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token from email
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Invalid or expired token
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

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [
    body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;

      const user = await get('SELECT * FROM users WHERE email = ?', [email]);

      // Always return 200 with generic message to avoid user enumeration
      if (!user) {
        return res.json({
          message: 'If an account exists with that email, a password reset link has been sent',
        });
      }

      // Generate reset token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await run(
        `INSERT INTO email_tokens (user_id, token_hash, type, expires_at)
         VALUES (?, ?, ?, ?)`,
        [user.id, tokenHash, 'reset', expiresAt.toISOString()]
      );

      // Send password reset email
      const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(user.email, user.full_name, resetUrl);
      } catch (emailErr) {
        console.error('Failed to send password reset email:', emailErr);
      }

      return res.json({
        message: 'If an account exists with that email, a password reset link has been sent',
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
    body('token').notEmpty().withMessage('Reset token is required'),
    body('new_password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { token, new_password } = req.body;

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const now = new Date().toISOString();

      const resetToken = await get(
        `SELECT * FROM email_tokens
         WHERE token_hash = ? AND type = 'reset' AND used_at IS NULL AND expires_at > ?`,
        [tokenHash, now]
      );

      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired password reset token' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(new_password, 12);

      // Update user password
      await run(
        `UPDATE users SET password_hash = ? WHERE id = ?`,
        [passwordHash, resetToken.user_id]
      );

      // Mark reset token as used
      await run(
        `UPDATE email_tokens SET used_at = ? WHERE id = ?`,
        [new Date().toISOString(), resetToken.id]
      );

      // Invalidate all other outstanding reset tokens for this user
      await run(
        `UPDATE email_tokens SET used_at = ? WHERE user_id = ? AND type = 'reset' AND used_at IS NULL AND id != ?`,
        [new Date().toISOString(), resetToken.user_id, resetToken.id]
      );

      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email resent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded (max once per 60 seconds)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// ── POST /api/auth/resend-verification ──────────────────────────────────────
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userRecord = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userRecord.id;
    const now = Date.now();
    const lastRequest = resendVerificationLimiter.get(userId);

    // Check rate limit: 60 seconds between requests
    if (lastRequest && now - lastRequest < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastRequest)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSeconds} seconds before requesting another verification email`,
      });
    }

    // Get user
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Invalidate existing unused verify tokens
    await run(
      `UPDATE email_tokens SET used_at = ? WHERE user_id = ? AND type = 'verify' AND used_at IS NULL`,
      [new Date().toISOString(), userId]
    );

    // Generate new verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await run(
      `INSERT INTO email_tokens (user_id, token_hash, type, expires_at)
       VALUES (?, ?, ?, ?)`,
      [userId, tokenHash, 'verify', expiresAt.toISOString()]
    );

    // Send verification email
    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${rawToken}`;
    try {
      await sendVerificationEmail(user.email, user.full_name, verifyUrl);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    // Update rate limiter
    resendVerificationLimiter.set(userId, now);

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

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
