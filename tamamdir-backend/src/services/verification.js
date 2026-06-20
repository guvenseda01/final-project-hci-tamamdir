const crypto = require('crypto');

const CODE_TTL_MINUTES = 15;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  const secret = process.env.EMAIL_VERIFICATION_SECRET;
  if (!secret) {
    throw new Error('EMAIL_VERIFICATION_SECRET is not configured');
  }
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

function getExpiryDate() {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
}

function isExpired(expiresAt) {
  return new Date(expiresAt).getTime() < Date.now();
}

module.exports = {
  CODE_TTL_MINUTES,
  generateCode,
  hashCode,
  getExpiryDate,
  isExpired,
};
