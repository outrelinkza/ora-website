/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe Price IDs for each plan
const PLAN_PRICE_IDS = {
  creator: 'price_1SSzEbAawVwKR3X2nnKqmteT', // $12.99/month - ORA Creator Plan
  pro: 'price_1SQ1FSAawVwKR3X2LEeBfKXt',     // $24.99/month - ORA Pro Plan
  premium: 'price_1SQ1FUAawVwKR3X2AfwilFhS',  // $49.99/month - ORA Premium Plan
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, userId, email } = req.body;

    // Validate plan
    if (!PLAN_PRICE_IDS[planId]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      // Update metadata if needed
      if (customer.metadata.userId !== userId) {
        await stripe.customers.update(customer.id, {
          metadata: { userId: userId || 'guest' },
        });
      }
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId || 'guest',
        },
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: PLAN_PRICE_IDS[planId],
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || 'https://myora.co'}/subscription-success?session_id={CHECKOUT_SESSION_ID}&userId=${userId || 'guest'}`,
      cancel_url: `${process.env.APP_URL || 'https://myora.co'}/subscription-cancel?userId=${userId || 'guest'}`,
      consent_collection: {
        promotions: 'auto',
        terms_of_service: 'required',
      },
      custom_text: {
        terms_of_service_acceptance: {
          message: 'By proceeding, you agree to our [Terms of Service](https://myora.co/terms-of-service) and [Privacy Policy](https://myora.co/privacy-policy).',
        },
      },
      metadata: {
        userId: userId || 'guest',
        planId: planId,
      },
      subscription_data: {
        metadata: {
          userId: userId || 'guest',
          planId: planId,
        },
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};

