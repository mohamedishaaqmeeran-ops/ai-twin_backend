// middleware/roleMiddleware.js

/**
 * Ensures the user has Admin privileges
 */
const requireAdmin = (req, res, next) => {
    // req.user is set by your existing protect middleware
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admins only.' });
    }
  };
  
  /**
   * Ensures the user has a specific paid plan
   */
  const requirePlan = (requiredPlan) => {
    return (req, res, next) => {
      // Example logic: if they need 'pro', block 'free' users
      if (req.user && (req.user.plan === requiredPlan || req.user.role === 'admin')) {
        next();
      } else {
        res.status(403).json({ error: `Upgrade to the ${requiredPlan} plan to access this feature.` });
      }
    };
  };
  
  module.exports = { requireAdmin, requirePlan };