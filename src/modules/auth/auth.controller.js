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
    let { email, password, confirmPassword, name, mobileNumber } = req.body;

    email = email?.trim().toLowerCase();
    name = name?.trim();
    mobileNumber = mobileNumber?.trim();

    if (!email || !password || !confirmPassword || !name || !mobileNumber) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one symbol.",
      });
    }

    const user = await authService.signupWithEmail(
      email,
      password,
      name,
      mobileNumber
    );

    return res.status(201).json({
      message: "Account created successfully.",
      user,
    });
  } catch (error) {
    if (
      error.message.includes("already exists") ||
      error.message.includes("Google account")
    ) {
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
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { user, systemToken } = await authService.loginWithEmail(
      email,
      password
    );

    res.cookie("token", systemToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    if (
      error.message.includes("Invalid") ||
      error.message.includes("Google") ||
      error.message.includes("verify")
    ) {
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