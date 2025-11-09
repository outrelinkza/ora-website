/**
 * Admin Errors API
 * GET /api/admin/errors
 * Returns error monitoring data
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
    let totalErrors = 0;
    let criticalErrors = 0;
    let resolvedErrors = 0;
    let unresolvedErrors = 0;
    let errors = [];

    if (supabase) {
      try {
        // Try to get errors from Supabase (if error_reports table exists)
        const { data: errorReports, error } = await supabase
          .from('error_reports')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (!error && errorReports) {
          totalErrors = errorReports.length;
          criticalErrors = errorReports.filter(e => e.severity === 'critical').length;
          resolvedErrors = errorReports.filter(e => e.resolved === true).length;
          unresolvedErrors = errorReports.filter(e => e.resolved === false).length;

          errors = errorReports.map(err => ({
            id: err.id,
            type: err.error_type,
            message: err.message,
            severity: err.severity,
            timestamp: err.timestamp,
            resolved: err.resolved
          }));
        }
      } catch (error) {
        console.error('Error fetching errors from Supabase:', error);
        // Table might not exist yet, return empty data
      }
    }

    return res.json({
      totalErrors,
      criticalErrors,
      resolvedErrors,
      unresolvedErrors,
      errors
    });
  } catch (error) {
    console.error('Error in admin errors:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

