/**
 * Admin Users API
 * GET /api/admin/users
 * Returns all users with their profile information
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
    let users = [];
    let totalUsers = 0;
    let activeUsers = 0;
    let subscribedUsers = 0;

    if (supabase) {
      try {
        // Get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!profilesError && profiles) {
          totalUsers = profiles.length;

          // Get subscriptions to check who's subscribed
          const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('user_id, status')
            .eq('status', 'active');

          const subscribedUserIds = new Set(
            (subscriptions || []).map(sub => sub.user_id)
          );
          subscribedUsers = subscribedUserIds.size;

          // Get social accounts to check activity
          const { data: socialAccounts } = await supabase
            .from('social_accounts')
            .select('user_id, updated_at');

          const activeUserIds = new Set(
            (socialAccounts || []).map(acc => acc.user_id)
          );
          activeUsers = activeUserIds.size;

          // Get last activity from various sources
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

          // Get recent activity indicators
          const { data: recentQuotes } = await supabase
            .from('quotes')
            .select('user_id, updated_at')
            .gte('updated_at', sevenDaysAgo);

          const { data: recentDeals } = await supabase
            .from('deals')
            .select('user_id, updated_at')
            .gte('updated_at', sevenDaysAgo);

          const activeUserSet = new Set([
            ...(recentQuotes || []).map(q => q.user_id),
            ...(recentDeals || []).map(d => d.user_id),
            ...activeUserIds
          ]);

          // Format users data
          users = profiles.map(profile => {
            const isSubscribed = subscribedUserIds.has(profile.id);
            const isActive = activeUserSet.has(profile.id);
            
            return {
              id: profile.id,
              email: profile.email || 'N/A',
              displayName: profile.display_name || 'N/A',
              createdAt: profile.created_at,
              updatedAt: profile.updated_at,
              isSubscribed,
              isActive,
              profileImage: profile.profile_image_url || null,
              bio: profile.bio || null
            };
          });
        }
      } catch (error) {
        console.error('Error fetching users from Supabase:', error);
      }
    }

    return res.json({
      users,
      totalUsers,
      activeUsers,
      subscribedUsers
    });
  } catch (error) {
    console.error('Error in admin users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

