const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (toEmail, verificationToken) => {
  const verifyLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

  try {
    await resend.emails.send({
      from: 'TWIN App <onboarding@resend.dev>', // Resend's default testing address
      to: toEmail,
      subject: 'Welcome to TWIN! Please verify your email',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Welcome to TWIN! 🚀</h2>
          <p>You're one step away from joining the ultimate AI prompt community.</p>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Verify My Account</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This link will expire in 24 hours.</p>
        </div>
      `,
    });
    console.log(`Verification email successfully sent to ${toEmail} via Resend`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Could not send verification email');
  }
};

const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: 'TWIN App <onboarding@resend.dev>',
      to: toEmail,
      subject: 'TWIN - Password Reset Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password for your TWIN account.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Reset Password</a>
        </div>
      `,
    });
    console.log(`Password reset email sent to ${toEmail} via Resend`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Could not send reset email');
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };