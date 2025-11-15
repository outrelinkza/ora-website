/**
 * Admin Quotes API
 * GET /api/admin/quotes
 * Returns all quotes with their status and metrics
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
    let quotes = [];
    let totalQuotes = 0;
    let statusBreakdown = {
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0
    };
    let totalQuoteValue = 0;
    let acceptedQuoteValue = 0;

    if (supabase) {
      try {
        // Get all quotes
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!quotesError && quotesData) {
          totalQuotes = quotesData.length;
          
          // Calculate totals and breakdown
          quotesData.forEach(quote => {
            if (quote.status && statusBreakdown.hasOwnProperty(quote.status)) {
              statusBreakdown[quote.status]++;
            }
            if (quote.calculated_rate) {
              const rate = parseFloat(quote.calculated_rate) || 0;
              totalQuoteValue += rate;
              if (quote.status === 'accepted') {
                acceptedQuoteValue += rate;
              }
            }
          });

          // Get recent quotes (last 20)
          quotes = quotesData.slice(0, 20).map(quote => ({
            id: quote.id,
            quoteName: quote.quote_name,
            platform: quote.platform,
            clientName: quote.client_name,
            status: quote.status,
            calculatedRate: quote.calculated_rate,
            followerCount: quote.follower_count,
            createdAt: quote.created_at,
            updatedAt: quote.updated_at
          }));
        }
      } catch (error) {
        console.error('Error fetching quotes from Supabase:', error);
      }
    }

    return res.json({
      quotes,
      totalQuotes,
      statusBreakdown,
      totalQuoteValue: Math.round(totalQuoteValue * 100) / 100,
      acceptedQuoteValue: Math.round(acceptedQuoteValue * 100) / 100
    });
  } catch (error) {
    console.error('Error in admin quotes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

