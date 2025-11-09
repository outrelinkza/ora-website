/**
 * Admin Overview API
 * GET /api/admin/overview
 * Returns overview statistics and recent activity
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

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
    // Get submissions from Supabase (if table exists) or return mock data
    let rateSubmissions = 0;
    let bugReports = 0;
    let activeUsers = 0;
    let recentActivity = [];

    if (supabase) {
      try {
        // Try to get submissions from Supabase
        const { data: submissions, error } = await supabase
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false })
          .limit(10);

        if (!error && submissions) {
          rateSubmissions = submissions.filter(s => s.type === 'rate_submission').length;
          bugReports = submissions.filter(s => s.type === 'bug_report').length;
          
          const uniqueEmails = new Set(submissions.map(s => s.user_email).filter(Boolean));
          activeUsers = uniqueEmails.size;

          recentActivity = submissions.slice(0, 5).map(sub => ({
            type: sub.type,
            details: sub.type === 'rate_submission' 
              ? `Rate: ${sub.brand_name || 'N/A'} - $${sub.rate || 0}`
              : `Bug: ${sub.title || 'N/A'}`,
            date: sub.submitted_at
          }));
        }
      } catch (error) {
        console.error('Error fetching from Supabase:', error);
        // Fallback to empty data
      }
    }

    // If no Supabase data, return structure with zeros
    return res.json({
      rateSubmissions,
      bugReports,
      activeUsers,
      totalSubmissions: rateSubmissions + bugReports,
      recentActivity: recentActivity.length > 0 ? recentActivity : []
    });
  } catch (error) {
    console.error('Error in admin overview:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

