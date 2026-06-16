const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const nodemailer = require('nodemailer');
require('dotenv').config();


console.log("SMTP Auth Check -> Email:", process.env.SMTP_EMAIL ? "Found" : "Missing", "| Pass:", process.env.SMTP_PASSWORD ? "Found" : "Missing");
// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Sends a verification email to a newly registered user
 * @param {string} toEmail - The user's email address
 * @param {string} verificationToken - The unique token for their account
 */
const sendVerificationEmail = async (toEmail, verificationToken) => {
  // The link points to your React frontend, which will then call your backend API
  const verifyLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"TWIN App" <${process.env.SMTP_EMAIL}>`,
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
  };
  

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Could not send verification email');
  }
};

const sendPasswordResetEmail = async (toEmail, resetToken) => {
    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  
    const mailOptions = {
      from: `"TWIN App" <${process.env.SMTP_EMAIL}>`,
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
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${toEmail}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Could not send reset email');
    }
  };

module.exports = { sendVerificationEmail, sendPasswordResetEmail };