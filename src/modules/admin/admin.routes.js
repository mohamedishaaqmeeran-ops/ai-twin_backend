const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/roleMiddleware');

// Protected by JWT (protect) and Role (requireAdmin)
router.get('/users', protect, requireAdmin, adminController.getAllUsers);

module.exports = router;