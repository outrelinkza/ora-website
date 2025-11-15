/**
 * Admin Deals & Revenue API
 * GET /api/admin/deals
 * Returns deals, revenue, and related metrics
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
    let deals = [];
    let totalDeals = 0;
    let totalRevenue = 0;
    let statusBreakdown = {
      active: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    };
    let recentDeals = [];

    if (supabase) {
      try {
        // Get all deals
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .order('created_at', { ascending: false });

        if (!dealsError && dealsData) {
          totalDeals = dealsData.length;
          
          // Calculate totals and breakdown
          dealsData.forEach(deal => {
            if (deal.status && statusBreakdown.hasOwnProperty(deal.status)) {
              statusBreakdown[deal.status]++;
            }
            if (deal.value) {
              totalRevenue += parseFloat(deal.value) || 0;
            }
          });

          // Get recent deals (last 20 for display)
          recentDeals = dealsData.slice(0, 20).map(deal => ({
            id: deal.id,
            title: deal.title,
            brandName: deal.brand_name,
            status: deal.status,
            value: deal.value,
            currency: deal.currency || 'USD',
            deadline: deal.deadline,
            createdAt: deal.created_at
          }));

          deals = dealsData;
        }

        // Get revenue tracking data
        const { data: revenueData } = await supabase
          .from('revenue_tracking')
          .select('total_earned, month')
          .order('month', { ascending: false });

        if (revenueData) {
          // Add revenue tracking to total if not already included
          const trackedRevenue = revenueData.reduce((sum, r) => {
            return sum + (parseFloat(r.total_earned) || 0);
          }, 0);
          
          // Use the higher value (deals or tracked revenue)
          if (trackedRevenue > totalRevenue) {
            totalRevenue = trackedRevenue;
          }
        }

        // Get quotes data for additional insights
        const { data: quotesData } = await supabase
          .from('quotes')
          .select('calculated_rate, status')
          .eq('status', 'accepted');

        let acceptedQuotesValue = 0;
        if (quotesData) {
          acceptedQuotesValue = quotesData.reduce((sum, q) => {
            return sum + (parseFloat(q.calculated_rate) || 0);
          }, 0);
        }

      } catch (error) {
        console.error('Error fetching deals from Supabase:', error);
      }
    }

    return res.json({
      deals: recentDeals,
      totalDeals,
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
      statusBreakdown,
      allDeals: deals
    });
  } catch (error) {
    console.error('Error in admin deals:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

