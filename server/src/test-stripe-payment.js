require('dotenv').config();
const stripe = require('./src/config/stripe');

const testStripePayment = async () => {
  console.log('🧪 Testing Stripe Configuration...\n');
  
  // Check if keys are test or live
  const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
  const pubKeyMode = process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_') ? 'test' : 'live';
  
  console.log(`🔑 Secret Key Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);
  console.log(`🔑 Publishable Key Mode: ${pubKeyMode.toUpperCase()}`);
  
  if (isTestMode) {
    console.log('✅ You are in TEST mode - no real money will be charged');
    console.log('💳 Use these test card numbers:');
    console.log('   Visa: 4242424242424242');
    console.log('   Visa (debit): 4000056655665556');
    console.log('   Mastercard: 5555555555554444');
    console.log('   Any future expiry date, any 3-digit CVC');
  } else {
    console.log('⚠️ WARNING: You are in LIVE mode - real money will be charged!');
  }
  
  try {
    // Test creating a payment intent
    console.log('\n📤 Testing payment intent creation...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00 or LKR 10.00 in cents
      currency: 'lkr',
      metadata: {
        test: 'true',
        orderId: 'test-order-123'
      }
    });
    
    console.log('✅ Payment intent created successfully!');
    console.log(`💰 Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
    console.log(`🆔 Payment Intent ID: ${paymentIntent.id}`);
    console.log(`📊 Status: ${paymentIntent.status}`);
    console.log(`🌐 Client Secret: ${paymentIntent.client_secret.substring(0, 20)}...`);
    
    console.log('\n✅ Stripe is configured correctly and working!');
    
    if (isTestMode) {
      console.log('\n💡 To test payments:');
      console.log('1. Go to your frontend payment form');
      console.log('2. Use test card: 4242424242424242');
      console.log('3. Use any future date for expiry');
      console.log('4. Use any 3-digit CVC');
      console.log('5. Check Stripe Dashboard for test transactions');
    }
    
  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('💡 Check your Stripe secret key in .env file');
    }
  }
};

// Run the test
testStripePayment();