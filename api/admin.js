/**
 * Consolidated Admin API Router
 * GET/POST /api/admin?type=overview|users|subscriptions|deals|quotes|business|submissions|analytics|errors
 * POST /api/admin?type=send-email
 * 
 * Routes all admin requests to appropriate handlers
 */

const overview = require('../lib/admin/overview');
const users = require('../lib/admin/users');
const subscriptions = require('../lib/admin/subscriptions');
const deals = require('../lib/admin/deals');
const quotes = require('../lib/admin/quotes');
const businessIntelligence = require('../lib/admin/business-intelligence');
const submissions = require('../lib/admin/submissions');
const analytics = require('../lib/admin/analytics');
const errors = require('../lib/admin/errors');
const sendEmail = require('../lib/admin/send-email');
const auth = require('../lib/admin/auth');

module.exports = async (req, res) => {
  const type = req.query.type || (req.body && req.body.type) || 'overview';

  try {
    switch (type) {
      case 'overview':
        return await overview(req, res);
      case 'users':
        return await users(req, res);
      case 'subscriptions':
        return await subscriptions(req, res);
      case 'deals':
        return await deals(req, res);
      case 'quotes':
        return await quotes(req, res);
      case 'business':
        return await businessIntelligence(req, res);
      case 'submissions':
        return await submissions(req, res);
      case 'analytics':
        return await analytics(req, res);
      case 'errors':
        return await errors(req, res);
      case 'send-email':
        return await sendEmail(req, res);
      case 'auth':
        return await auth(req, res);
      default:
        return res.status(400).json({ error: 'Invalid type parameter. Use: overview, users, subscriptions, deals, quotes, business, submissions, analytics, errors, send-email, or auth' });
    }
  } catch (error) {
    console.error(`Error in admin API router (${type}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

