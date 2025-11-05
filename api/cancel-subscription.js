/**
 * Cancel Subscription
 * POST /api/cancel-subscription
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const deletedSubscription = await stripe.subscriptions.cancel(subscriptionId);

    res.json({
      success: true,
      id: deletedSubscription.id,
      cancelAtPeriodEnd: deletedSubscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
};

