const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/email');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  /**
   * Verifies Google Token, Upserts user into Postgres, and returns a system JWT
   * @param {string} googleToken - The id_token received from the React frontend
   */
  async verifyAndAuthenticateGoogleUser(googleToken) {
    // 1. Verify the incoming Google ID Token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatarUrl } = payload;

    // 2. SQL Upsert query: Insert new user OR update last_login if they already exist
    // Update the SQL Upsert query to explicitly set is_verified to true
    const upsertQuery = `
      INSERT INTO users (google_id, email, name, avatar_url, is_verified)
      VALUES ($1, $2, $3, $4, TRUE)
      ON CONFLICT (google_id) 
      DO UPDATE SET 
        last_login = CURRENT_TIMESTAMP,
        avatar_url = EXCLUDED.avatar_url,
        name = EXCLUDED.name,
        is_verified = TRUE
      RETURNING id, google_id, email, name, avatar_url;
    `;

    const values = [googleId, email, name, avatarUrl];
    const result = await db.query(upsertQuery, values);
    const user = result.rows[0];

    // 3. Generate internal application JWT
    // 6. Generate the login session JWT
    const systemToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role, // NEW: Inject the role
        plan: user.plan  // NEW: Inject the plan
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { user, systemToken };
  }
  /**
   * Registers a new user via Email, Password, and Mobile Number
   * Bypasses email verification for instant frictionless onboarding
   */
  async signupWithEmail(email, password, name, mobileNumber) {
    // 1. Check if the email is already in use
    const userCheck = await db.query('SELECT id, google_id FROM users WHERE email = $1', [email]);
    
    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      // If they already signed up via Google, remind them
      if (existingUser.google_id) {
        throw new Error('This email is linked to a Google account. Please log in with Google.');
      }
      throw new Error('An account with this email already exists.');
    }

    // 2. Hash the password (10 salt rounds balance speed/security)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insert the new user into PostgreSQL
    // We include mobile_number and force is_verified to TRUE right away
    const insertQuery = `
      INSERT INTO users (email, name, mobile_number, password_hash, is_verified)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, email, name, mobile_number;
    `;
    const values = [email, name, mobileNumber, passwordHash];
    const result = await db.query(insertQuery, values);
    const newUser = result.rows[0];

    // NOTE: Verification token generation and background email dispatch (sendVerificationEmail) 
    // have been removed to facilitate instant login access.

    return newUser;
  }

  async verifyEmailToken(token) {
    // 1. Find the user with this token where the expiration date is still in the future
    const query = `
      SELECT id, email, name 
      FROM users 
      WHERE verification_token = $1 AND token_expires_at > NOW()
    `;
    const result = await db.query(query, [token]);

    if (result.rows.length === 0) {
      throw new Error('Verification link is invalid or has expired.');
    }

    const user = result.rows[0];

    // 2. Activate the user and wipe the token data so it can't be reused
    await db.query(`
      UPDATE users 
      SET is_verified = TRUE, 
          verification_token = NULL, 
          token_expires_at = NULL,
          last_login = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [user.id]);

    // 3. Generate the login session JWT
    const systemToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { user, systemToken };
  }
  /**
   * Authenticates an existing user via Email and Password
   */
  async loginWithEmail(email, password) {
    // 1. Find the user by email
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password.');
    }

    const user = result.rows[0];

    // 2. Prevent Google users from getting stuck if they try to type a password
    if (user.google_id && !user.password_hash) {
      throw new Error('This account is linked to Google. Please use the "Sign in with Google" button.');
    }

    // 3. Compare the typed password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    // 4. Check if they have verified their email
    // if (!user.is_verified) {
    //   throw new Error('Please verify your email address before logging in.');
    // }

    // 5. Update their last_login timestamp
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // 6. Generate the login session JWT
    const systemToken = jwt.sign(
      { id: user.id, email: user.email , role: user.role, plan: user.plan},
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Filter out sensitive data before returning
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    };

    return { user: safeUser, systemToken };
  }

  /**
   * Generates a reset token and sends the email
   */
  async requestPasswordReset(email) {
    const userCheck = await db.query('SELECT id, google_id FROM users WHERE email = $1', [email]);
    
    if (userCheck.rows.length === 0) {
      // Security best practice: Don't reveal if an email exists or not to prevent snooping
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const user = userCheck.rows[0];

    // Block Google users from trying to reset a password they don't have
    if (user.google_id) {
      throw new Error('This account uses Google Login. You cannot reset a password here.');
    }

    // Generate token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
      [resetToken, expiresAt, user.id]
    );

    sendPasswordResetEmail(email, resetToken).catch(console.error);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  /**
   * Verifies the token and updates the password
   */
  async resetPassword(token, newPassword) {
    const query = 'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()';
    const result = await db.query(query, [token]);

    if (result.rows.length === 0) {
      throw new Error('Reset link is invalid or has expired.');
    }

    const user = result.rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and wipe the token
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    return { message: 'Password has been successfully reset. You can now log in.' };
  }
}

module.exports = new AuthService();