/**
 * Consolidated Admin API
 * GET/POST /api/admin?type=overview|users|subscriptions|deals|quotes|business|submissions|analytics|errors
 * POST /api/admin?type=send-email
 * 
 * This consolidates all admin endpoints into a single serverless function
 * to stay within Vercel's Hobby plan limit of 12 functions
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Stripe integration (optional)
let stripe = null;
try {
  const Stripe = require('stripe');
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey) {
    stripe = Stripe(stripeSecretKey);
  }
} catch (error) {
  // Stripe not configured
}

// Admin authentication check
function checkAuth(req) {
  const adminToken = req.headers['x-admin-token'] || req.query.token || (req.body && req.body.token);
  const adminPassword = process.env.ADMIN_PASSWORD || 'ora_admin_2025';
  const expectedToken = process.env.ADMIN_TOKEN || adminPassword;
  
  return adminToken === expectedToken || adminToken === adminPassword;
}

module.exports = async (req, res) => {
  // Check authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const type = req.query.type || req.body?.type || 'overview';

  try {
    switch (type) {
      case 'overview':
        return await handleOverview(req, res);
      case 'users':
        return await handleUsers(req, res);
      case 'subscriptions':
        return await handleSubscriptions(req, res);
      case 'deals':
        return await handleDeals(req, res);
      case 'quotes':
        return await handleQuotes(req, res);
      case 'business':
        return await handleBusinessIntelligence(req, res);
      case 'submissions':
        return await handleSubmissions(req, res);
      case 'analytics':
        return await handleAnalytics(req, res);
      case 'errors':
        return await handleErrors(req, res);
      case 'send-email':
        return await handleSendEmail(req, res);
      default:
        return res.status(400).json({ error: 'Invalid type parameter' });
    }
  } catch (error) {
    console.error(`Error in admin API (${type}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Import handlers from separate files (we'll inline them for simplicity)
// For now, let's use a simpler approach - load the handlers dynamically

async function handleOverview(req, res) {
  // Overview handler logic
  const { default: handler } = await import('./overview.js');
  return handler(req, res);
}

async function handleUsers(req, res) {
  const { default: handler } = await import('./users.js');
  return handler(req, res);
}

async function handleSubscriptions(req, res) {
  const { default: handler } = await import('./subscriptions.js');
  return handler(req, res);
}

async function handleDeals(req, res) {
  const { default: handler } = await import('./deals.js');
  return handler(req, res);
}

async function handleQuotes(req, res) {
  const { default: handler } = await import('./quotes.js');
  return handler(req, res);
}

async function handleBusinessIntelligence(req, res) {
  const { default: handler } = await import('./business-intelligence.js');
  return handler(req, res);
}

async function handleSubmissions(req, res) {
  const { default: handler } = await import('./submissions.js');
  return handler(req, res);
}

async function handleAnalytics(req, res) {
  const { default: handler } = await import('./analytics.js');
  return handler(req, res);
}

async function handleErrors(req, res) {
  const { default: handler } = await import('./errors.js');
  return handler(req, res);
}

async function handleSendEmail(req, res) {
  const { default: handler } = await import('./send-email.js');
  return handler(req, res);
}

