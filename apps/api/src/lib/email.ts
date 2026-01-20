import { Resend } from 'resend';

// Lazy initialization to avoid crash when RESEND_API_KEY is not set
let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'ElizaGotchi <noreply@elizagotchi.fun>';

export async function sendWelcomeEmail(to: string, name: string) {
  const client = getResend();
  if (!client) {
    console.log(`[Email] RESEND_API_KEY not set - skipping welcome email to ${to}`);
    return;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to ElizaGotchi OS!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">Welcome to ElizaGotchi OS!</h1>
          <p>Hey ${name || 'there'},</p>
          <p>Your account has been created successfully. You can now deploy AI agents that work 24/7 for you.</p>
          <p>
            <a href="${process.env.FRONTEND_URL || 'https://elizagotchi.fun'}/dashboard"
               style="display: inline-block; background: linear-gradient(to right, #ec4899, #7c3aed); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Go to Dashboard
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 32px;">
            If you didn't create this account, you can ignore this email.
          </p>
        </div>
      `,
    });
    console.log(`[Email] Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`[Email] Failed to send welcome email:`, error);
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const client = getResend();
  if (!client) {
    console.log(`[Email] RESEND_API_KEY not set - skipping reset email to ${to}`);
    console.log(`[Email] Reset token: ${resetToken}`);
    return;
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'https://elizagotchi.fun'}/reset-password?token=${resetToken}`;

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset your ElizaGotchi password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">Reset Your Password</h1>
          <p>We received a request to reset your password. Click the button below to set a new one:</p>
          <p>
            <a href="${resetUrl}"
               style="display: inline-block; background: linear-gradient(to right, #ec4899, #7c3aed); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link expires in 1 hour.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 32px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    console.log(`[Email] Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`[Email] Failed to send password reset email:`, error);
  }
}
