const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tamamdir-dev-secret-change-in-prod';

/**
 * Attach `req.user` from the Bearer token.
 * Returns 401 if missing / invalid.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Same as requireAuth but only logs a warning and continues if no token.
 * Useful for public endpoints that benefit from knowing the caller.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch { /* ignore */ }
  }
  next();
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { requireAuth, optionalAuth, signToken };
