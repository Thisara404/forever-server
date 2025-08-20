const crypto = require('crypto');

const payHereConfig = {
  merchant_id: process.env.PAYHERE_MERCHANT_ID,
  merchant_secret: process.env.PAYHERE_MERCHANT_SECRET,
  currency: 'LKR',
  sandbox: process.env.NODE_ENV !== 'production',
  
  // URLs - Fixed to use correct frontend URL
  return_url: `${process.env.CLIENT_URL}/payment/success`,
  cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
  notify_url: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payments/payhere/notify`,
  
  // PayHere URLs
  sandbox_url: 'https://sandbox.payhere.lk/pay/checkout',
  live_url: 'https://www.payhere.lk/pay/checkout'
};

// Validate configuration
if (!payHereConfig.merchant_id || !payHereConfig.merchant_secret) {
  console.error('❌ PayHere merchant credentials not configured');
}

// Generate PayHere hash - Fixed format
const generatePayHereHash = (data) => {
  const {
    merchant_id,
    order_id,
    amount,
    currency = 'LKR',
    merchant_secret
  } = data;

  // PayHere hash format: md5(merchant_id + order_id + amount + currency + merchant_secret)
  const amountFormatted = parseFloat(amount).toFixed(2);
  const hashString = `${merchant_id}${order_id}${amountFormatted}${currency}${merchant_secret}`;
  
  console.log('Hash string for PayHere:', hashString); // Debug log
  
  const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
  console.log('Generated hash:', hash); // Debug log
  
  return hash;
};

// Verify PayHere notification hash
const verifyPayHereHash = (data) => {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
    merchant_secret
  } = data;

  const hashString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${merchant_secret}`;
  const localHash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
  
  return localHash === md5sig;
};

module.exports = {
  payHereConfig,
  generatePayHereHash,
  verifyPayHereHash
};