const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Test the configuration on startup
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not set in environment variables');
  process.exit(1);
}

if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.error('❌ Invalid STRIPE_SECRET_KEY format');
  process.exit(1);
}

console.log('✅ Stripe configuration loaded successfully');

module.exports = stripe;