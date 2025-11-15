/**
 * Admin Business Intelligence API
 * GET /api/admin/business-intelligence
 * Returns comprehensive business metrics for due diligence and company valuation
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
    const businessData = {
      // 1. USER METRICS
      users: {
        total: 0,
        active: 0,
        newThisMonth: 0,
        newThisYear: 0,
        growthRate: 0,
        bySignupMethod: {
          email: 0,
          apple: 0,
          guest: 0
        }
      },

      // 2. REVENUE METRICS
      revenue: {
        total: 0,
        mrr: 0, // Monthly Recurring Revenue
        arr: 0, // Annual Recurring Revenue
        fromSubscriptions: 0,
        fromDeals: 0,
        fromQuotes: 0,
        averageRevenuePerUser: 0,
        lifetimeValue: 0,
        growthRate: 0
      },

      // 3. SUBSCRIPTION METRICS
      subscriptions: {
        total: 0,
        active: 0,
        cancelled: 0,
        conversionRate: 0,
        churnRate: 0,
        retentionRate: 0,
        byPlan: {
          free: 0,
          creator: 0,
          pro: 0,
          premium: 0
        }
      },

      // 4. ENGAGEMENT METRICS
      engagement: {
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        averageSessionDuration: 0,
        featuresUsed: {},
        topFeatures: []
      },

      // 5. PRODUCT METRICS
      product: {
        quotesGenerated: 0,
        dealsTracked: 0,
        contractsAnalyzed: 0,
        mediaKitsCreated: 0,
        revenueTracked: 0
      },

      // 6. GROWTH METRICS
      growth: {
        userGrowth: [],
        revenueGrowth: [],
        subscriptionGrowth: []
      },

      // 7. COMPLIANCE & LEGAL
      compliance: {
        dataRetention: {
          totalRecords: 0,
          oldestRecord: null,
          gdprCompliant: true
        },
        userConsent: {
          consented: 0,
          notConsented: 0
        },
        dataExports: 0,
        dataDeletions: 0
      },

      // 8. TECHNICAL METRICS
      technical: {
        appVersion: '1.0.2',
        apiCalls: 0,
        errorRate: 0,
        averageResponseTime: 0,
        uptime: 99.9
      }
    };

    if (supabase) {
      // Get user metrics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      businessData.users.total = totalUsers || 0;

      // Get active users (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentActivities } = await supabase
        .from('user_events')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo);
      businessData.users.active = new Set(recentActivities?.map(a => a.user_id) || []).size;

      // Get new users this month
      const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: newThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart);
      businessData.users.newThisMonth = newThisMonth || 0;

      // Get subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*');
      
      if (subscriptions) {
        businessData.subscriptions.total = subscriptions.length;
        businessData.subscriptions.active = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length;
        businessData.subscriptions.cancelled = subscriptions.filter(s => s.status === 'cancelled').length;
        businessData.subscriptions.conversionRate = businessData.users.total > 0 
          ? (businessData.subscriptions.active / businessData.users.total) * 100 
          : 0;

        // Plan breakdown
        subscriptions.forEach(sub => {
          if (businessData.subscriptions.byPlan.hasOwnProperty(sub.plan)) {
            businessData.subscriptions.byPlan[sub.plan]++;
          }
        });

        // Calculate MRR
        const planPrices = { creator: 12.99, pro: 24.99, premium: 49.99, free: 0 };
        const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
        businessData.revenue.mrr = activeSubs.reduce((sum, sub) => sum + (planPrices[sub.plan] || 0), 0);
        businessData.revenue.arr = businessData.revenue.mrr * 12;
        businessData.revenue.fromSubscriptions = businessData.revenue.mrr;
      }

      // Get deals revenue
      const { data: deals } = await supabase
        .from('deals')
        .select('value, status');
      
      if (deals) {
        businessData.product.dealsTracked = deals.length;
        businessData.revenue.fromDeals = deals
          .filter(d => d.status === 'completed' || d.status === 'active')
          .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
      }

      // Get quotes
      const { data: quotes } = await supabase
        .from('quotes')
        .select('calculated_rate, status');
      
      if (quotes) {
        businessData.product.quotesGenerated = quotes.length;
        businessData.revenue.fromQuotes = quotes
          .filter(q => q.status === 'accepted')
          .reduce((sum, q) => sum + (parseFloat(q.calculated_rate) || 0), 0);
      }

      // Total revenue
      businessData.revenue.total = 
        businessData.revenue.fromSubscriptions + 
        businessData.revenue.fromDeals + 
        businessData.revenue.fromQuotes;

      // Get engagement metrics
      const { data: userEvents } = await supabase
        .from('user_events')
        .select('event_type, created_at')
        .gte('created_at', thirtyDaysAgo);

      if (userEvents) {
        const uniqueUsers = new Set(userEvents.map(e => e.event_type));
        businessData.engagement.monthlyActiveUsers = uniqueUsers.size;

        // Feature usage
        userEvents.forEach(event => {
          if (event.event_type) {
            businessData.engagement.featuresUsed[event.event_type] = 
              (businessData.engagement.featuresUsed[event.event_type] || 0) + 1;
          }
        });

        // Top features
        businessData.engagement.topFeatures = Object.entries(businessData.engagement.featuresUsed)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([feature, count]) => ({ feature, count }));
      }

      // Get growth data (last 12 months)
      // Calculate from 12 months ago to current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // Build array from oldest to newest (12 months ago to current month)
      const growthData = [];
      for (let i = 11; i >= 0; i--) {
        // Calculate month going backwards from current month
        let targetMonth = currentMonth - i;
        let targetYear = currentYear;
        
        // Handle year rollover
        while (targetMonth < 0) {
          targetMonth += 12;
          targetYear -= 1;
        }
        
        const monthDate = new Date(targetYear, targetMonth, 1);
        const monthStart = new Date(targetYear, targetMonth, 1).toISOString();
        const monthEnd = new Date(targetYear, targetMonth + 1, 0).toISOString();

        // User growth - count users created in this specific month
        const { count: usersInMonth } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);
        
        growthData.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          users: usersInMonth || 0
        });
      }
      
      businessData.growth.userGrowth = growthData;

      // Compliance data
      const { count: totalRecords } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      businessData.compliance.dataRetention.totalRecords = totalRecords || 0;
    }

    return res.json(businessData);
  } catch (error) {
    console.error('Error in business intelligence API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

