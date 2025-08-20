const stripe = require('../config/stripe');
const Order = require('../model/Order');
const Cart = require('../model/Cart');
const Product = require('../model/Product');
const { payHereConfig, generatePayHereHash, verifyPayHereHash } = require('../config/payhere');
const { confirmOrderPayment, cancelPaymentPendingOrder } = require('./orderController');

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/stripe/create-payment-intent
// @access  Private
const createStripePaymentIntent = async (req, res) => {
  try {
    console.log('Stripe request received:', req.body);
    
    const { amount, currency = 'lkr', orderId } = req.body;

    // Validate inputs
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided',
        debug: { amount, type: typeof amount }
      });
    }

    // Check minimum amount for Stripe
    const minimumAmountLKR = 200;
    if (amount < minimumAmountLKR) {
      return res.status(400).json({
        success: false,
        message: `Stripe payments require a minimum amount of LKR ${minimumAmountLKR}. Your order total is LKR ${amount}. Please use PayHere or Cash on Delivery for smaller amounts.`,
        minAmount: minimumAmountLKR,
        currentAmount: amount,
        suggestedMethods: ['payhere', 'cod']
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Verify the order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // **NEW: Check if order is in payment_pending status**
    if (order.orderStatus !== 'payment_pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in payment pending status'
      });
    }

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    console.log('Creating Stripe payment intent:', {
      amount: amountInCents,
      currency: currency.toLowerCase(),
      orderId
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        orderId: orderId,
        userId: req.user._id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created successfully:', paymentIntent.id);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe payment intent error:', error);
    
    if (error.type === 'StripeInvalidRequestError' && error.code === 'amount_too_small') {
      return res.status(400).json({
        success: false,
        message: 'Amount is too small for Stripe payments. Please use PayHere or Cash on Delivery for smaller amounts.',
        error: error.message,
        suggestedMethods: ['payhere', 'cod'],
        minAmount: 200
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

// @desc    Confirm Stripe Payment
// @route   POST /api/payments/stripe/confirm
// @access  Private
const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and order ID are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // **NEW: Use the new confirmOrderPayment function**
      const paymentInfo = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        update_time: new Date().toISOString(),
        email_address: req.user.email
      };

      const order = await confirmOrderPayment(orderId, paymentInfo);

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        order
      });
    } else {
      // **NEW: Cancel the order if payment failed**
      await cancelPaymentPendingOrder(orderId);
      
      res.status(400).json({
        success: false,
        message: 'Payment not successful',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Stripe payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment confirmation failed',
      error: error.message
    });
  }
};

// Update PayHere notification handler
const payHereNotification = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method,
      status_message,
      card_holder_name,
      card_no
    } = req.body;

    console.log('PayHere Notification:', req.body);

    // Verify the hash
    const isValidHash = verifyPayHereHash({
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      merchant_secret: payHereConfig.merchant_secret
    });

    if (!isValidHash) {
      console.error('Invalid PayHere hash');
      return res.status(400).send('Invalid hash');
    }

    if (status_code === '2') { // Success
      // **NEW: Use confirmOrderPayment function**
      const paymentInfo = {
        id: `payhere_${Date.now()}`,
        status: 'completed',
        update_time: new Date().toISOString(),
        email_address: order.shippingAddress.email,
        method: method,
        card_holder_name: card_holder_name,
        card_no: card_no ? `****-****-****-${card_no.slice(-4)}` : null
      };

      await confirmOrderPayment(order_id, paymentInfo);
      console.log('Payment successful for order:', order_id);

    } else { // Failed or cancelled
      // **NEW: Cancel the order**
      await cancelPaymentPendingOrder(order_id);
      console.log('Payment failed for order:', order_id, 'Message:', status_message);
    }

    // Send success response to PayHere
    res.status(200).send('OK');

  } catch (error) {
    console.error('PayHere notification error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// @desc    Create PayHere Payment
// @route   POST /api/payments/payhere/create-payment
// @access  Private
const createPayHerePayment = async (req, res) => {
  try {
    console.log('PayHere payment request:', req.body);
    
    const { orderId, amount, currency = 'LKR' } = req.body;

    // Validate PayHere configuration
    if (!payHereConfig.merchant_id || !payHereConfig.merchant_secret) {
      return res.status(500).json({
        success: false,
        message: 'PayHere merchant configuration is missing'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Format amount properly
    const formattedAmount = parseFloat(amount).toFixed(2);
    
    // Generate PayHere payment data
    const paymentData = {
      merchant_id: payHereConfig.merchant_id,
      order_id: orderId,
      amount: formattedAmount,
      currency: currency,
      items: order.items.map(item => item.name).join(', '),
      first_name: order.shippingAddress.firstName,
      last_name: order.shippingAddress.lastName,
      email: order.shippingAddress.email,
      phone: order.shippingAddress.phone,
      address: order.shippingAddress.street,
      city: order.shippingAddress.city,
      country: order.shippingAddress.country,
      return_url: payHereConfig.return_url,
      cancel_url: payHereConfig.cancel_url,
      notify_url: payHereConfig.notify_url
    };

    // Generate hash
    const hash = generatePayHereHash({
      merchant_id: paymentData.merchant_id,
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      merchant_secret: payHereConfig.merchant_secret
    });

    paymentData.hash = hash;

    console.log('PayHere payment data generated:', {
      merchant_id: paymentData.merchant_id,
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      hash: hash
    });

    // Return payment data for frontend
    res.status(200).json({
      success: true,
      paymentData,
      paymentUrl: payHereConfig.sandbox ? payHereConfig.sandbox_url : payHereConfig.live_url
    });

  } catch (error) {
    console.error('PayHere payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PayHere payment',
      error: error.message
    });
  }
};

// @desc    Process Cash on Delivery Order
// @route   POST /api/payments/cod/process
// @access  Private
const processCODOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update order status for COD
    order.orderStatus = 'confirmed';
    order.paymentInfo = {
      id: `cod_${Date.now()}`,
      status: 'pending',
      update_time: new Date().toISOString(),
      email_address: req.user.email
    };

    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [], totalAmount: 0, totalItems: 0 }
    );

    res.status(200).json({
      success: true,
      message: 'COD order processed successfully',
      order
    });

  } catch (error) {
    console.error('COD processing error:', error);
    res.status(500).json({
      success: false,
      message: 'COD order processing failed',
      error: error.message
    });
  }
};

// @desc    Get payment status
// @route   GET /api/payments/status/:orderId
// @access  Private
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select('isPaid paidAt paymentMethod paymentInfo orderStatus');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      paymentStatus: {
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        paymentMethod: order.paymentMethod,
        paymentInfo: order.paymentInfo,
        orderStatus: order.orderStatus
      }
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
};

module.exports = {
  createStripePaymentIntent,
  confirmStripePayment,
  createPayHerePayment,
  payHereNotification,
  processCODOrder,
  getPaymentStatus
};