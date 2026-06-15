const app = require('./app');
const { pool } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Verify Database connectivity before booting the API listener
    await pool.query('SELECT NOW()');
    console.log('Database verification step passed.');

    // 2. Start listening for incoming HTTP traffic
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`  HOOOD Server running in ${process.env.NODE_ENV} mode`);
      console.log(`  Listening on local network port: ${PORT}`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Fatal initialization error. Failed to spin up backend:', error.message);
    process.exit(1);
  }
};

startServer();