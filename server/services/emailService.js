const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  // In production, use actual SMTP settings
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // For development/testing, use ethereal or log to console
  // This will log emails to console instead of actually sending
  return {
    sendMail: async (options) => {
      console.log('=== EMAIL WOULD BE SENT ===');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Text:', options.text);
      console.log('HTML:', options.html ? '[HTML Content]' : 'N/A');
      console.log('===========================');
      return { messageId: 'dev-' + Date.now() };
    }
  };
};

/**
 * Generate a random 8-digit verification code
 */
const generateVerificationCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

/**
 * Send email change verification code
 * @param {string} toEmail - The current email address to send to
 * @param {string} code - The 8-digit verification code
 * @param {string} newEmail - The new email they're changing to
 */
const sendEmailChangeCode = async (toEmail, code, newEmail) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Bar Bend" <noreply@barbend.com>',
    to: toEmail,
    subject: 'Bar Bend - Email Change Verification Code',
    text: `
You requested to change your email address to: ${newEmail}

Your verification code is: ${code}

This code will expire in 15 minutes.

If you did not request this change, please ignore this email and your email will remain unchanged.

- The Bar Bend Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #FF6B35; font-size: 24px; font-weight: bold; }
    .code-box { background-color: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #FF6B35; }
    .new-email { background-color: #FFF0EB; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .warning { color: #666; font-size: 14px; margin-top: 20px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Bar Bend</div>
    </div>

    <p>You requested to change your email address.</p>

    <div class="new-email">
      <strong>New email:</strong> ${newEmail}
    </div>

    <p>Enter this verification code to confirm the change:</p>

    <div class="code-box">
      <div class="code">${code}</div>
    </div>

    <p class="warning">This code will expire in 15 minutes. If you did not request this change, please ignore this email.</p>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Bar Bend. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email change verification sent to:', toEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Generate a secure random token for password reset
 */
const generateResetToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Send password reset email
 * @param {string} toEmail - The email address to send to
 * @param {string} firstName - User's first name
 * @param {string} resetToken - The reset token
 */
const sendPasswordResetEmail = async (toEmail, firstName, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Bar Bend" <noreply@barbend.com>',
    to: toEmail,
    subject: 'Bar Bend - Password Reset Request',
    text: `
Hi ${firstName},

You requested to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email and your password will remain unchanged.

- The Bar Bend Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #FF6B35; font-size: 24px; font-weight: bold; }
    .button { display: inline-block; background-color: #FF6B35; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .button:hover { background-color: #E55A2B; }
    .link-fallback { background-color: #f5f5f5; padding: 15px; border-radius: 8px; word-break: break-all; font-size: 14px; margin: 15px 0; }
    .warning { color: #666; font-size: 14px; margin-top: 20px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Bar Bend</div>
    </div>

    <p>Hi ${firstName},</p>

    <p>You requested to reset your password. Click the button below to create a new password:</p>

    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <div class="link-fallback">${resetUrl}</div>

    <p class="warning">This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Bar Bend. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', toEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send password reset confirmation email
 * @param {string} toEmail - The email address
 * @param {string} firstName - User's first name
 */
const sendPasswordResetConfirmation = async (toEmail, firstName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Bar Bend" <noreply@barbend.com>',
    to: toEmail,
    subject: 'Bar Bend - Password Changed Successfully',
    text: `
Hi ${firstName},

Your password has been successfully changed.

If you did not make this change, please contact support immediately.

- The Bar Bend Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #FF6B35; font-size: 24px; font-weight: bold; }
    .success { background-color: #DCFCE7; color: #22C55E; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
    .warning { color: #DC2626; font-size: 14px; margin-top: 20px; background-color: #FEF2F2; padding: 15px; border-radius: 8px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Bar Bend</div>
    </div>

    <p>Hi ${firstName},</p>

    <div class="success">
      <strong>Your password has been successfully changed!</strong>
    </div>

    <p>You can now log in with your new password.</p>

    <p class="warning">If you did not make this change, please contact support immediately as your account may have been compromised.</p>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Bar Bend. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset confirmation sent to:', toEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send password reset confirmation:', error);
    return { success: false, error: error.message };
  }
};

const sendEmailChangeConfirmation = async (toEmail, firstName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Bar Bend" <noreply@barbend.com>',
    to: toEmail,
    subject: 'Bar Bend - Email Address Updated',
    text: `
Hi ${firstName},

Your email address has been successfully updated to this address.

You can now use this email to log in to your Bar Bend account.

If you did not make this change, please contact support immediately.

- The Bar Bend Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #FF6B35; font-size: 24px; font-weight: bold; }
    .success { background-color: #DCFCE7; color: #22C55E; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Bar Bend</div>
    </div>

    <p>Hi ${firstName},</p>

    <div class="success">
      <strong>Your email address has been successfully updated!</strong>
    </div>

    <p>You can now use this email to log in to your Bar Bend account.</p>

    <p>If you did not make this change, please contact support immediately.</p>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Bar Bend. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email change confirmation sent to:', toEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Don't throw here - the email change succeeded, confirmation is just nice to have
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateVerificationCode,
  generateResetToken,
  sendEmailChangeCode,
  sendEmailChangeConfirmation,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};
