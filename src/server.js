require("dotenv").config({ path: ".env" });

console.log("RESEND KEY:", process.env.RESEND_API_KEY);

const app = require("./app");
const { pool } = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("Database verification step passed.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Fatal initialization error:", error.message);
    process.exit(1);
  }
};

startServer();