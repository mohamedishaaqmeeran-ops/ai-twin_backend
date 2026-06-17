const db = require('../../config/db'); 

const adminController = {
  async getAllUsers(req, res) {
    try {
      const query = `
        SELECT id, name, email, mobile_number, role, plan, is_verified, created_at 
        FROM users 
        ORDER BY created_at DESC;
      `;
      
      const result = await db.query(query);
      
      return res.status(200).json({
        totalUsers: result.rowCount,
        users: result.rows
      });
      
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error while fetching users' });
    }
  }
};

module.exports = adminController;