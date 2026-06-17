const express = require('express');
const authController = require('./auth.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authLimiter } = require('../../middleware/rateLimiter');
const { validate } = require('../../middleware/validate'); // Import the validation engine
const schemas = require('./auth.validation'); // Import your specific rules
const { protect } = require('../../middleware/authMiddleware');
const { requireAdmin, requirePlan } = require('../../middleware/roleMiddleware');

const router = express.Router();

// Sensitive routes now have Rate Limiting AND strict Input Validation
router.post('/register', authLimiter, validate(schemas.signupSchema), authController.handleSignup);
router.post('/login', authLimiter, validate(schemas.loginSchema), authController.handleLogin);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPasswordSchema), authController.handleForgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPasswordSchema), authController.handleResetPassword);

router.get('/admin/users', protect, requireAdmin, adminController.getAllUsers);

// Only Pro users can generate high-res images
router.post('/generate-8k', protect, requirePlan('pro'), imageController.generate);

// Standard routes
router.post('/google', authController.handleGoogleLogin);
router.post('/logout', authController.handleLogout);
router.post('/verify-email', authController.handleVerifyEmail);
router.get('/me', protect, (req, res) => {
  return res.status(200).json({ authenticated: true, user: req.user });
});

module.exports = router;