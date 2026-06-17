const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import routes (We will create this next)
const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes'); // <-- Add this

const app = express();
app.set('trust proxy', 1);
// 1. CORS Configuration
// This allows your React frontend (running on a different port) to talk to your API
// Look at your browser's address bar when you open test_login.html.
// Replace the 5500 URL below with whatever URL your browser is currently showing.
const allowedOrigins = [
    'http://localhost:5173', 
    'http://127.0.0.1:5500', 
    'http://localhost:5500',

    'https://ai-twin-63zh.vercel.app',
    'https://ai-twin-git-1064507568780.asia-south1.run.app' // <-- Your new live frontend domain!

  // <-- Your new live frontend domain!

  ];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// 2. Global Parsers
app.use(express.json());             // Parses incoming JSON body requests (req.body)
app.use(cookieParser());            // Parses cookies attached to client requests (req.cookies)

// 3. Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'HOOOD Core API is operational' });
});

// 4. Module Routes (Prefixing features cleanly)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // <-- Add this
// 5. Global 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Resource not found' });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('System Error Boundary:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;