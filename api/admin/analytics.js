/**
 * Admin Analytics API
 * GET /api/admin/analytics
 * Returns user analytics and subscription data
 */

const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    let totalUsers = 0;
    let paidUsers = 0;
    let subscriptionRevenue = 0;
    let conversionRate = 0;
    let platformDistribution = {};

    // Get user data from Supabase
    if (supabase) {
      try {
        // Get total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        totalUsers = userCount || 0;

        // Get subscriptions from Supabase
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('status', 'active');

        if (subscriptions) {
          paidUsers = subscriptions.length;
          
          // Calculate revenue from Stripe
          try {
            const stripeSubscriptions = await stripe.subscriptions.list({
              limit: 100,
              status: 'active'
            });

            subscriptionRevenue = stripeSubscriptions.data.reduce((sum, sub) => {
              return sum + (sub.items.data[0]?.price?.unit_amount || 0) / 100;
            }, 0);
          } catch (stripeError) {
            console.error('Error fetching Stripe data:', stripeError);
            // Fallback: calculate from Supabase subscriptions
            subscriptionRevenue = subscriptions.reduce((sum, sub) => {
              return sum + (sub.price || 0);
            }, 0);
          }

          conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;
        }

        // Get platform distribution from submissions
        const { data: submissions } = await supabase
          .from('submissions')
          .select('platform')
          .eq('type', 'rate_submission');

        if (submissions) {
          submissions.forEach(sub => {
            if (sub.platform) {
              platformDistribution[sub.platform] = (platformDistribution[sub.platform] || 0) + 1;
            }
          });
        }
      } catch (error) {
        console.error('Error fetching analytics from Supabase:', error);
      }
    }

    return res.json({
      totalUsers,
      paidUsers,
      subscriptionRevenue,
      conversionRate,
      platformDistribution
    });
  } catch (error) {
    console.error('Error in admin analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

