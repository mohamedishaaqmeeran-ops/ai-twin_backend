const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for sensitive authentication routes to prevent brute-force attacks.
 * Limits users to 5 attempts per 15 minutes per IP address.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 5 requests per windowMs
  message: { 
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' 
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { authLimiter };