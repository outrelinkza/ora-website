/**
 * Admin Authentication API
 * POST /api/admin/auth
 * Validates admin password and returns token
 */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'ora_admin_2025';

    if (password === adminPassword) {
      // Generate a simple token (in production, use JWT)
      const token = Buffer.from(`admin_${Date.now()}`).toString('base64');
      
      return res.json({
        success: true,
        token: process.env.ADMIN_TOKEN || adminPassword
      });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error in admin auth:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

