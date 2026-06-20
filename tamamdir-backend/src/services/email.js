const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@tamamdir.local';

/**
 * Send email verification link
 */
async function sendVerificationEmail(to, fullName, verifyUrl) {
  const subject = 'Verify your Tamamdır email';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background: #667eea; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; display: inline-block; font-weight: 600; }
    .button:hover { background: #764ba2; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tamamdır</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Verify your email address</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${fullName},</p>
      <p>Welcome to Tamamdır! To complete your registration, please verify your email address by clicking the button below.</p>
      <div class="button-container">
        <a href="${verifyUrl}" class="button">Verify Email</a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy this link: <br><code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px; word-break: break-all;">${verifyUrl}</code></p>
      <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
      <div class="footer">
        <p>If you didn't create a Tamamdır account, you can safely ignore this email.</p>
        <p>© 2026 Tamamdır. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `Verify your Tamamdır email

Hi ${fullName},

Welcome to Tamamdır! To complete your registration, please verify your email address by visiting this link:

${verifyUrl}

This link expires in 24 hours.

If you didn't create a Tamamdır account, you can safely ignore this email.

© 2026 Tamamdır. All rights reserved.
  `;

  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });
    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

/**
 * Send password reset link
 */
async function sendPasswordResetEmail(to, fullName, resetUrl) {
  const subject = 'Reset your Tamamdır password';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background: #667eea; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; display: inline-block; font-weight: 600; }
    .button:hover { background: #764ba2; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tamamdır</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Reset your password</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${fullName},</p>
      <p>We received a request to reset your Tamamdır password. Click the button below to create a new password.</p>
      <div class="button-container">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy this link: <br><code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px; word-break: break-all;">${resetUrl}</code></p>
      <div class="warning">
        <strong>Security note:</strong> This link expires in 1 hour and can only be used once. If you didn't request a password reset, please ignore this email or contact support.
      </div>
      <div class="footer">
        <p>© 2026 Tamamdır. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `Reset your Tamamdır password

Hi ${fullName},

We received a request to reset your Tamamdır password. Visit this link to create a new password:

${resetUrl}

This link expires in 1 hour and can only be used once.

If you didn't request a password reset, please ignore this email or contact support.

© 2026 Tamamdır. All rights reserved.
  `;

  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });
    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
