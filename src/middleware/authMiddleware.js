const jwt = require("jsonwebtoken");
const db = require("../config/db"); // adjust path if needed

const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Access denied. No session token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      `
      SELECT id, name, email, role, plan, avatar_url
      FROM users
      WHERE id = $1
      `,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not found.",
      });
    }

    req.user = result.rows[0];

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return res.status(401).json({
      error: "Unauthorized",
      message: "Session has expired or is invalid. Please log in again.",
    });
  }
};

module.exports = { protect };