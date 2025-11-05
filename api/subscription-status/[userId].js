/**
 * Get Subscription Status
 * GET /api/subscription-status/:userId
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLAN_PRICE_IDS = {
  creator: 'price_1SQ1FQAawVwKR3X2YD7Kddza',
  pro: 'price_1SQ1FSAawVwKR3X2LEeBfKXt',
  premium: 'price_1SQ1FUAawVwKR3X2AfwilFhS',
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    // Find customer by metadata
    const customers = await stripe.customers.list({
      limit: 100,
    });

    const customer = customers.data.find(
      (c) => c.metadata?.userId === userId
    );

    if (!customer) {
      return res.json({ subscription: null });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.json({ subscription: null });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;

    // Map Price ID to plan ID
    let planId = 'free';
    if (priceId === PLAN_PRICE_IDS.creator) planId = 'creator';
    else if (priceId === PLAN_PRICE_IDS.pro) planId = 'pro';
    else if (priceId === PLAN_PRICE_IDS.premium) planId = 'premium';

    res.json({
      subscription: {
        id: subscription.id,
        customerId: customer.id,
        plan: planId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: error.message });
  }
};

