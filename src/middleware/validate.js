/**
 * Middleware that validates the request body against a Zod schema.
 */
const validate = (schema) => (req, res, next) => {
    try {
      // 1. Parse the incoming request body
      schema.parse(req.body);
      next();
    } catch (error) {
      // 2. Safely check for Zod's "issues" array (Modern Zod versions)
      if (error && error.issues && error.issues.length > 0) {
        return res.status(400).json({ error: error.issues[0].message });
      }
      
      // 3. Fallback for older Zod versions that use "errors"
      if (error && error.errors && error.errors.length > 0) {
        return res.status(400).json({ error: error.errors[0].message });
      }
  
      // 4. If it's a totally different code bug, log it cleanly
      console.error("🔥 Unknown Validation Error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  module.exports = { validate };