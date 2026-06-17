const authService = require('./auth.service');

class AuthController {
  /**
   * Handles Google Web Login / Signup handshakes
   */
  async handleGoogleLogin(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Google ID Token is required' });
      }

      // Execute auth service pipeline
      const { user, systemToken } = await authService.verifyAndAuthenticateGoogleUser(token);

      // Bake the token into a highly secure HttpOnly Cookie
      res.cookie('token', systemToken, {
        httpOnly: true,
        secure: true,       // REQUIRED: Tells the browser it's safe to send over HTTPS (Railway)
        sameSite: 'none',   // REQUIRED: Allows your local HTML file to send cookies to the live server
        path: '/',          // CRITICAL: Tells the cookie it is allowed to go to /api/admin, not just /api/auth
        maxAge: 24 * 60 * 60 * 1000 // 1 day (or whatever you currently have)
      });

      // Respond with the basic user payload (do NOT send the JWT in the body)
      return res.status(200).json({
        message: 'Authentication successful',
        user,
      });
    } catch (error) {
      // Pass any verification or database runtime exceptions to global app crash error boundary
      next(error);
    }
  }
  /**
   * Handles traditional Email/Password Signup
   */
  async handleSignup(req, res, next) {
    try {
      const { email, password, confirmPassword, name, mobileNumber } = req.body;
      // Basic Validation
      if (!email || !password || !name || !mobileNumber) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Execute the signup service
      await authService.signupWithEmail(email, password, name, mobileNumber);

      // Note: We do NOT send an HttpOnly cookie back here. 
      // The user must verify their email before they are allowed to log in.
      return res.status(201).json({
        message: 'Account created successfully.',
      });

    } catch (error) {
      // If the service threw our custom "account exists" error, send a 400
      if (error.message.includes('already exists') || error.message.includes('Google account')) {
         return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * Handles incoming email verification requests
   */
  async handleVerifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
      }

      // Execute verification service
      const { user, systemToken } = await authService.verifyEmailToken(token);

      // Log the user in immediately by setting the HttpOnly cookie
      res.cookie('token', systemToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return res.status(200).json({
        message: 'Email successfully verified. You are now logged in.',
        user,
      });
    } catch (error) {
      if (error.message.includes('invalid or has expired')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  /**
   * Clears the user session cookie on logout
   */

  /**
   * Handles traditional Email/Password Login
   */
  async handleLogin(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Execute login service
      const { user, systemToken } = await authService.loginWithEmail(email, password);

      // Issue the secure cookie
      res.cookie('token', systemToken, {
        httpOnly: true,
        secure: true,       // REQUIRED: Tells the browser it's safe to send over HTTPS (Railway)
        sameSite: 'none',   // REQUIRED: Allows your local HTML file to send cookies to the live server
        path: '/',          // CRITICAL: Tells the cookie it is allowed to go to /api/admin, not just /api/auth
        maxAge: 24 * 60 * 60 * 1000 // 1 day (or whatever you currently have)
      });

      return res.status(200).json({
        message: 'Login successful',
        user,
      });

    } catch (error) {
      // Send safe, generic error messages back to the frontend
      if (error.message.includes('Invalid') || error.message.includes('Google') || error.message.includes('verify')) {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  }

  async handleForgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });

      const response = await authService.requestPasswordReset(email);
      return res.status(200).json(response);
    } catch (error) {
      if (error.message.includes('Google Login')) return res.status(400).json({ error: error.message });
      next(error);
    }
  }

  async handleResetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

      const response = await authService.resetPassword(token, newPassword);
      return res.status(200).json(response);
    } catch (error) {
      if (error.message.includes('invalid or has expired')) return res.status(400).json({ error: error.message });
      next(error);
    }
  }

  async handleLogout(req, res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}

module.exports = new AuthController();