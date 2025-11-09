/**
 * Trigger Test Webhook Event
 * Creates a test subscription which will trigger webhook events
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function triggerWebhook() {
  try {
    console.log('🔧 Creating test subscription to trigger webhook...\n');

    // Create a test customer
    const customer = await stripe.customers.create({
      email: `test-${Date.now()}@example.com`,
      metadata: {
        userId: 'test-user-webhook',
      },
    });
    console.log('✅ Created test customer:', customer.id);

    // Create a payment method (test card)
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });
    console.log('✅ Created test payment method');

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });
    console.log('✅ Attached payment method to customer');

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Create a subscription - this will trigger customer.subscription.created webhook
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: 'price_1SQ1FQAawVwKR3X2YD7Kddza', // Creator plan
        },
      ],
      metadata: {
        userId: 'test-user-webhook',
        planId: 'creator',
      },
    });

    console.log('✅ Created subscription:', subscription.id);
    console.log('✅ Subscription status:', subscription.status);
    console.log('\n📡 Webhook Events Triggered:');
    console.log('   - customer.subscription.created');
    console.log('   - invoice.created');
    console.log('   - invoice.payment_succeeded (if payment succeeds)');
    console.log('\n📝 Next Steps:');
    console.log('1. Check Vercel Dashboard → Your website project → Functions → Logs');
    console.log('2. Look for messages like: "Subscription created: sub_..."');
    console.log('3. Check Stripe Dashboard → Webhooks → Your endpoint → Recent events');
    console.log('4. You should see events with status 200 OK');
    console.log('\n✅ Test completed! The webhook should have been triggered.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.type === 'StripeCardError') {
      console.error('   Card error:', error.message);
    }
    process.exit(1);
  }
}

triggerWebhook();

