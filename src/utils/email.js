const { Resend } = require('resend');
require('dotenv').config();

console.log("Resend API Key Check -> Status:", process.env.RESEND_API_KEY ? "Found" : "Missing");

// Initialize the Resend client with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a verification email to a newly registered user
 * @param {string} toEmail - The user's email address
 * @param {string} verificationToken - The unique token for their account
 */
const sendVerificationEmail = async (toEmail, verificationToken) => {
  const verifyLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

  try {
    const { data, error } = await resend.emails.send({
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

    if (error) {
      console.error('Resend API Error sending verification email:', error);
      throw new Error('Could not send verification email');
    }

    console.log(`Verification email successfully sent to ${toEmail}. ID: ${data.id}`);
  } catch (error) {
    console.error('Error in sendVerificationEmail wrapper:', error);
    throw new Error('Could not send verification email');
  }
};

/**
 * Sends a password reset email to a user
 * @param {string} toEmail - The user's email address
 * @param {string} resetToken - The unique password reset token
 */
const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'TWIN App <onboarding@resend.dev>',
      to: toEmail,
      subject: 'TWIN - Password Reset Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password for your TWIN account.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error sending password reset email:', error);
      throw new Error('Could not send reset email');
    }

    console.log(`Password reset email sent to ${toEmail}. ID: ${data.id}`);
  } catch (error) {
    console.error('Error in sendPasswordResetEmail wrapper:', error);
    throw new Error('Could not send reset email');
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };