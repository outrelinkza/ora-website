/**
 * Test Webhook Script
 * This script creates a test checkout session which will trigger a webhook event
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testWebhook() {
  try {
    console.log('Creating test checkout session to trigger webhook...\n');

    // Create a test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      metadata: {
        userId: 'test-user-123',
      },
    });
    console.log('✅ Created test customer:', customer.id);

    // Create a test checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: 'price_1SQ1FQAawVwKR3X2YD7Kddza', // Creator plan
          quantity: 1,
        },
      ],
      success_url: 'https://myora.co/test-success',
      cancel_url: 'https://myora.co/test-cancel',
      metadata: {
        userId: 'test-user-123',
        planId: 'creator',
      },
    });
    console.log('✅ Created checkout session:', session.id);
    console.log('✅ Session URL:', session.url);
    console.log('\n📝 Next steps:');
    console.log('1. The checkout session has been created');
    console.log('2. Stripe will automatically send a webhook event when the session is completed');
    console.log('3. To trigger the webhook immediately, you can:');
    console.log('   - Complete the checkout session at:', session.url);
    console.log('   - Or use test card: 4242 4242 4242 4242');
    console.log('\n4. Check your Vercel logs to see if the webhook was received');
    console.log('5. Check Stripe Dashboard → Webhooks → Your endpoint → Recent events');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testWebhook();

