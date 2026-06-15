
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
 user: process.env.DB_USER,
 host: process.env.DB_HOST,
 database: process.env.DB_DATABASE,
 password: process.env.DB_PASSWORD,
 port: process.env.DB_PORT,
 // Max number of clients in the pool
 max: 20,
 // How long a client is allowed to remain idle before being closed
 idleTimeoutMillis: 30000,
 // How long to wait for a connection before timing out
 connectionTimeoutMillis: 2000,
});

// Test connection on initialization
pool.on('connect', () => {
 console.log('PostgreSQL connection pool established successfully.');
});

pool.on('error', (err) => {
 console.error('Unexpected error on idle PostgreSQL client:', err);
 process.exit(-1);
});

module.exports = {
 query: (text, params) => pool.query(text, params),
 pool // Exporting the pool itself for transactions later if needed
};