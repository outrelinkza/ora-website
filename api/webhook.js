/**
 * Stripe Webhook Handler
 * POST /api/webhook
 * Handles Stripe webhook events and saves to Supabase
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for webhook access
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://uljciarseazzcqptwuly.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Get raw body - Vercel serverless functions receive body as Buffer/string
  let body = req.body;
  if (typeof body === 'string') {
    body = Buffer.from(body, 'utf8');
  } else if (!Buffer.isBuffer(body)) {
    // If body was parsed as JSON, we need to stringify it back
    body = Buffer.from(JSON.stringify(body), 'utf8');
  }

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      
      // Get userId and planId from session metadata
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      
      if (userId && planId && userId !== 'guest') {
        try {
          // Get customer to find subscription
          const customer = await stripe.customers.retrieve(session.customer);
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            const stripeSubscription = subscriptions.data[0];
            await saveSubscriptionToSupabase(userId, planId, customer.id, stripeSubscription);
          }
        } catch (error) {
          console.error('Error handling checkout.session.completed:', error);
        }
      }
      break;

    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object;
      console.log('Subscription created:', subscriptionCreated.id);
      
      // Get userId from customer metadata
      try {
        const customer = await stripe.customers.retrieve(subscriptionCreated.customer);
        const userId = customer.metadata?.userId;
        
        if (userId && userId !== 'guest') {
          // Determine plan from price ID
          const priceId = subscriptionCreated.items.data[0]?.price?.id;
          const planId = getPlanIdFromPriceId(priceId);
          
          if (planId) {
            await saveSubscriptionToSupabase(userId, planId, customer.id, subscriptionCreated);
          }
        }
      } catch (error) {
        console.error('Error handling customer.subscription.created:', error);
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object;
      console.log('Subscription updated:', subscriptionUpdated.id);
      
      try {
        const customer = await stripe.customers.retrieve(subscriptionUpdated.customer);
        const userId = customer.metadata?.userId;
        
        if (userId && userId !== 'guest') {
          const priceId = subscriptionUpdated.items.data[0]?.price?.id;
          const planId = getPlanIdFromPriceId(priceId);
          const status = mapStripeStatusToSupabase(subscriptionUpdated.status);
          
          await updateSubscriptionInSupabase(userId, subscriptionUpdated.id, {
            plan: planId,
            status: status,
            stripe_subscription_id: subscriptionUpdated.id,
            current_period_start: new Date(subscriptionUpdated.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscriptionUpdated.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscriptionUpdated.cancel_at_period_end || false,
            trial_end: subscriptionUpdated.trial_end ? new Date(subscriptionUpdated.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error handling customer.subscription.updated:', error);
      }
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object;
      console.log('Subscription deleted:', subscriptionDeleted.id);
      
      try {
        const customer = await stripe.customers.retrieve(subscriptionDeleted.customer);
        const userId = customer.metadata?.userId;
        
        if (userId && userId !== 'guest') {
          await updateSubscriptionInSupabase(userId, subscriptionDeleted.id, {
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error handling customer.subscription.deleted:', error);
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('Invoice payment succeeded:', invoice.id);
      // Subscription is already active, no action needed
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('Invoice payment failed:', failedInvoice.id);
      
      try {
        if (failedInvoice.subscription) {
          const stripeSubscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
          const customer = await stripe.customers.retrieve(stripeSubscription.customer);
          const userId = customer.metadata?.userId;
          
          if (userId && userId !== 'guest') {
            await updateSubscriptionInSupabase(userId, stripeSubscription.id, {
              status: 'past_due',
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Error handling invoice.payment_failed:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

/**
 * Helper function to save subscription to Supabase
 */
async function saveSubscriptionToSupabase(userId, planId, stripeCustomerId, stripeSubscription) {
  try {
    // Only save if userId is a valid UUID (not 'guest' or guest-xxx)
    if (!userId || userId === 'guest' || userId.startsWith('guest-')) {
      console.log('Skipping Supabase save for guest user:', userId);
      return;
    }

    // Validate UUID format (Supabase uses UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.log('Invalid userId format, skipping Supabase save:', userId);
      return;
    }

    const subscriptionData = {
      user_id: userId,
      plan: planId,
      status: mapStripeStatusToSupabase(stripeSubscription.status),
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscription.id,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
      trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    // Upsert subscription (insert or update if exists)
    // Using service role key bypasses RLS policies
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving subscription to Supabase:', error);
    } else {
      console.log('Subscription saved to Supabase:', data.id, 'for user:', userId);
    }
  } catch (error) {
    console.error('Error in saveSubscriptionToSupabase:', error);
  }
}

/**
 * Helper function to update subscription in Supabase
 */
async function updateSubscriptionInSupabase(userId, stripeSubscriptionId, updates) {
  try {
    // Only update if userId is a valid UUID (not 'guest' or guest-xxx)
    if (!userId || userId === 'guest' || userId.startsWith('guest-')) {
      console.log('Skipping Supabase update for guest user:', userId);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.log('Invalid userId format, skipping Supabase update:', userId);
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription in Supabase:', error);
    } else {
      console.log('Subscription updated in Supabase:', data.id, 'for user:', userId);
    }
  } catch (error) {
    console.error('Error in updateSubscriptionInSupabase:', error);
  }
}

/**
 * Map Stripe subscription status to Supabase status
 */
function mapStripeStatusToSupabase(stripeStatus) {
  const statusMap = {
    'active': 'active',
    'canceled': 'cancelled',
    'past_due': 'past_due',
    'trialing': 'trialing',
    'unpaid': 'expired',
    'incomplete': 'expired',
    'incomplete_expired': 'expired',
  };
  return statusMap[stripeStatus] || 'active';
}

/**
 * Get plan ID from Stripe price ID
 */
function getPlanIdFromPriceId(priceId) {
  // Stripe Price IDs for each plan (from your backend)
  const PLAN_PRICE_IDS = {
    'price_1SQ1FQAawVwKR3X2YD7Kddza': 'creator', // $14.99/month
    'price_1SQ1FSAawVwKR3X2LEeBfKXt': 'pro',     // $24.99/month
    'price_1SQ1FUAawVwKR3X2AfwilFhS': 'premium', // $49.99/month
  };
  return PLAN_PRICE_IDS[priceId] || null;
}
