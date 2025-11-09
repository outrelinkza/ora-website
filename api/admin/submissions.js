/**
 * Admin Submissions API
 * GET /api/admin/submissions?filter=all|rates|bugs
 * Returns filtered submissions
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = async (req, res) => {
  // Check admin authentication
  const adminToken = req.headers['x-admin-token'] || req.query.token;
  const adminPassword = process.env.ADMIN_PASSWORD || 'ora_admin_2025';
  const expectedToken = process.env.ADMIN_TOKEN || adminPassword;
  
  if (adminToken !== expectedToken && adminToken !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const filter = req.query.filter || 'all';
    let submissions = [];

    if (supabase) {
      try {
        let query = supabase.from('submissions').select('*');

        if (filter === 'rates') {
          query = query.eq('type', 'rate_submission');
        } else if (filter === 'bugs') {
          query = query.eq('type', 'bug_report');
        }

        const { data, error } = await query.order('submitted_at', { ascending: false });

        if (!error && data) {
          submissions = data.map(sub => ({
            id: sub.id,
            type: sub.type,
            details: sub.type === 'rate_submission'
              ? `Rate: ${sub.brand_name || 'N/A'} - $${sub.rate || 0}`
              : `Bug: ${sub.title || 'N/A'}`,
            userEmail: sub.user_email,
            submittedAt: sub.submitted_at,
            data: sub
          }));
        }
      } catch (error) {
        console.error('Error fetching submissions from Supabase:', error);
      }
    }

    return res.json({ submissions });
  } catch (error) {
    console.error('Error in admin submissions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

