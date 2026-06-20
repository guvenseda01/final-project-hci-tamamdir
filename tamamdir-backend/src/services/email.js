const RESEND_API_URL = 'https://api.resend.com/emails';

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL
    ?? process.env.EMAIL_FROM
    ?? 'Tamamdır <noreply@tamamdir.local>';
}

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY missing — email not sent');
    return { success: false, skipped: true };
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[email] Resend API error:', data);
    throw new Error(data.message || `Resend request failed (${res.status})`);
  }

  return { success: true, id: data.id };
}

/**
 * Send 6-digit email verification code (Resend REST API via fetch).
 */
async function sendVerificationEmail(email, code) {
  const subject = 'Tamamdır e-posta doğrulama kodu';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111;">Tamamdır</h2>
      <p>E-posta adresinizi doğrulamak için doğrulama kodunuz:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #16a34a;">${code}</p>
      <p style="color: #666; font-size: 14px;">Bu kod 15 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
    </div>
  `;
  const text = `Tamamdır e-posta doğrulama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email] DEV — verification code for ${email}: ${code}`);
    return { success: true, dev: true };
  }

  return sendViaResend({ to: email, subject, html, text });
}

module.exports = {
  sendVerificationEmail,
};
