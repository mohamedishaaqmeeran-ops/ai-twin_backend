const jwt = require('jsonwebtoken');

/**
 * Protects routes by verifying the HttpOnly session cookie
 */
const protect = (req, res, next) => {
  // 1. Extract the token from the incoming cookies
  const token = req.cookies?.token;

  // 2. Reject if no token is present
  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Access denied. No session token provided.' 
    });
  }

  try {
    // 3. Verify the token signature against your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach user context to the request object
    // 4. Attach user context to the request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role, // NEW: Pass the role to the next bouncer
      plan: decoded.plan  // NEW: Pass the plan to the next bouncer
    };

    // 5. Pass control to the next handler/controller
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    
    // Clear the invalid cookie immediately to reset the client state
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Session has expired or is invalid. Please log in again.' 
    });
  }
};

module.exports = { protect };