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
        // Get errors from error_logs table (real-time app errors)
        const { data: errorLogs, error } = await supabase
          .from('error_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && errorLogs) {
          totalErrors = errorLogs.length;
          
          // Determine severity from metadata
          criticalErrors = errorLogs.filter(e => {
            const severity = e.metadata?.severity || 'medium';
            return severity === 'critical';
          }).length;
          
          resolvedErrors = errorLogs.filter(e => e.resolved === true).length;
          unresolvedErrors = errorLogs.filter(e => e.resolved === false).length;

          errors = errorLogs.map(err => ({
            id: err.id,
            type: err.error_type,
            message: err.error_message,
            severity: err.metadata?.severity || 'medium',
            timestamp: err.created_at,
            resolved: err.resolved,
            screen: err.screen_name,
            device: err.device_type,
            appVersion: err.app_version,
            stack: err.error_stack,
            metadata: err.metadata
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

