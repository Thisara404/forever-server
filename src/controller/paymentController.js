const stripe = require("../config/stripe");
const Order = require("../model/Order");
const Cart = require("../model/Cart");
const Product = require("../model/Product");
const {
  payHereConfig,
  generatePayHereHash,
  verifyPayHereHash,
} = require("../config/payhere");
const {
  confirmOrderPayment,
  cancelPaymentPendingOrder,
} = require("./orderController");

// @desc    Create Stripe Payment Intent (JWT Token Only)
// @route   POST /api/payments/stripe/create-payment-intent
// @access  Private
const createStripePaymentIntent = async (req, res) => {
  try {
    console.log("Stripe request received:", req.body);

    const { orderId, amount, currency = "lkr" } = req.body;

    // SECURITY: Validate inputs
    if (!orderId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order ID and valid amount are required",
      });
    }

    // SECURITY: Find order and validate ownership through JWT
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // SECURITY: Verify order belongs to authenticated user
    if (order.userId.toString() !== req.user._id.toString()) {
      console.warn(
        `🚨 Unauthorized payment attempt: User ${req.user._id} tried to pay for order ${orderId} belonging to ${order.userId}`
      );
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // SECURITY: Validate order status
    if (order.orderStatus !== "payment_pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not available for payment",
        currentStatus: order.orderStatus,
      });
    }

    // FIXED: Proper amount validation
    const orderTotal = parseFloat(order.totalAmount);
    const paymentAmount = parseFloat(amount);

    console.log("💰 Amount validation:", {
      orderTotal,
      paymentAmount,
      match: orderTotal === paymentAmount,
    });

    if (paymentAmount !== orderTotal) {
      console.warn(
        `🚨 Amount mismatch: Expected ${orderTotal}, received ${paymentAmount}`
      );
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paymentAmount}) does not match order total (${orderTotal})`,
        expected: orderTotal,
        received: paymentAmount,
      });
    }

    // Check minimum amount for Stripe
    const minimumAmountLKR = 200;
    if (paymentAmount < minimumAmountLKR) {
      return res.status(400).json({
        success: false,
        message: `Stripe payments require a minimum amount of LKR ${minimumAmountLKR}`,
        minAmount: minimumAmountLKR,
        currentAmount: paymentAmount,
        suggestedMethods: ["payhere", "cod"],
      });
    }

    // Convert amount to cents for Stripe (LKR to cents)
    const amountInCents = Math.round(paymentAmount * 100);

    console.log("Creating Stripe payment intent:", {
      amount: amountInCents,
      currency: currency.toLowerCase(),
      orderId,
      userId: req.user._id,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        orderId: orderId,
        userId: req.user._id.toString(),
        userEmail: req.user.email,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log("✅ Payment intent created successfully:", paymentIntent.id);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: orderId,
    });
  } catch (error) {
    console.error("❌ Stripe payment intent error:", error);

    if (
      error.type === "StripeInvalidRequestError" &&
      error.code === "amount_too_small"
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount is too small for Stripe payments",
        suggestedMethods: ["payhere", "cod"],
        minAmount: 200,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Payment service unavailable",
    });
  }
};

// @desc    Confirm Stripe Payment (Enhanced Security)
// @route   POST /api/payments/stripe/confirm
// @access  Private
const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID and order ID are required",
      });
    }

    // SECURITY: Validate order ownership again
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      console.warn(
        `🚨 Unauthorized payment confirmation: User ${req.user._id} tried to confirm payment for order ${orderId}`
      );
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Retrieve and validate payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // SECURITY: Verify payment intent metadata matches
    if (
      paymentIntent.metadata.orderId !== orderId ||
      paymentIntent.metadata.userId !== req.user._id.toString()
    ) {
      console.warn(`🚨 Payment metadata mismatch for order ${orderId}`);
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    if (paymentIntent.status === "succeeded") {
      const paymentInfo = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        update_time: new Date().toISOString(),
        email_address: req.user.email,
        amount_paid: paymentIntent.amount / 100,
      };

      const confirmedOrder = await confirmOrderPayment(orderId, paymentInfo);

      console.log(
        `✅ Payment confirmed for order ${orderId} by user ${req.user._id}`
      );

      res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
        orderId: confirmedOrder._id,
      });
    } else {
      await cancelPaymentPendingOrder(orderId);

      console.warn(
        `❌ Payment failed for order ${orderId}: ${paymentIntent.status}`
      );

      res.status(400).json({
        success: false,
        message: "Payment not successful",
        status: paymentIntent.status,
      });
    }
  } catch (error) {
    console.error("❌ Stripe payment confirmation error:", error);
    res.status(500).json({
      success: false,
      message: "Payment confirmation failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Payment service error",
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
      card_no,
    } = req.body;

    console.log("PayHere Notification:", req.body);

    // Verify the hash
    const isValidHash = verifyPayHereHash({
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      merchant_secret: payHereConfig.merchant_secret,
    });

    if (!isValidHash) {
      console.error("Invalid PayHere hash");
      return res.status(400).send("Invalid hash");
    }

    if (status_code === "2") {
      // Success
      // **NEW: Use confirmOrderPayment function**
      const paymentInfo = {
        id: `payhere_${Date.now()}`,
        status: "completed",
        update_time: new Date().toISOString(),
        email_address: order.shippingAddress.email,
        method: method,
        card_holder_name: card_holder_name,
        card_no: card_no ? `****-****-****-${card_no.slice(-4)}` : null,
      };

      await confirmOrderPayment(order_id, paymentInfo);
      console.log("Payment successful for order:", order_id);
    } else {
      // Failed or cancelled
      // **NEW: Cancel the order**
      await cancelPaymentPendingOrder(order_id);
      console.log(
        "Payment failed for order:",
        order_id,
        "Message:",
        status_message
      );
    }

    // Send success response to PayHere
    res.status(200).send("OK");
  } catch (error) {
    console.error("PayHere notification error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// @desc    Create PayHere Payment
// @route   POST /api/payments/payhere/create-payment
// @access  Private
const createPayHerePayment = async (req, res) => {
  try {
    console.log("PayHere payment request:", req.body);

    const { orderId, amount, currency = "LKR" } = req.body;

    // Validate PayHere configuration
    if (!payHereConfig.merchant_id || !payHereConfig.merchant_secret) {
      return res.status(500).json({
        success: false,
        message: "PayHere merchant configuration is missing",
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
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
      items: order.items.map((item) => item.name).join(", "),
      first_name: order.shippingAddress.firstName,
      last_name: order.shippingAddress.lastName,
      email: order.shippingAddress.email,
      phone: order.shippingAddress.phone,
      address: order.shippingAddress.street,
      city: order.shippingAddress.city,
      country: order.shippingAddress.country,
      return_url: payHereConfig.return_url,
      cancel_url: payHereConfig.cancel_url,
      notify_url: payHereConfig.notify_url,
    };

    // Generate hash
    const hash = generatePayHereHash({
      merchant_id: paymentData.merchant_id,
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      merchant_secret: payHereConfig.merchant_secret,
    });

    paymentData.hash = hash;

    console.log("PayHere payment data generated:", {
      merchant_id: paymentData.merchant_id,
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      hash: hash,
    });

    // Return payment data for frontend
    res.status(200).json({
      success: true,
      paymentData,
      paymentUrl: payHereConfig.sandbox
        ? payHereConfig.sandbox_url
        : payHereConfig.live_url,
    });
  } catch (error) {
    console.error("PayHere payment creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create PayHere payment",
      error: error.message,
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
        message: "Order not found",
      });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update order status for COD
    order.orderStatus = "confirmed";
    order.paymentInfo = {
      id: `cod_${Date.now()}`,
      status: "pending",
      update_time: new Date().toISOString(),
      email_address: req.user.email,
    };

    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [], totalAmount: 0, totalItems: 0 }
    );

    res.status(200).json({
      success: true,
      message: "COD order processed successfully",
      order,
    });
  } catch (error) {
    console.error("COD processing error:", error);
    res.status(500).json({
      success: false,
      message: "COD order processing failed",
      error: error.message,
    });
  }
};

// @desc    Get payment status
// @route   GET /api/payments/status/:orderId
// @access  Private
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select(
      "isPaid paidAt paymentMethod paymentInfo orderStatus"
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      paymentStatus: {
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        paymentMethod: order.paymentMethod,
        paymentInfo: order.paymentInfo,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
    });
  }
};

// Add this new function for simplified Stripe processing
const processStripePayment = async (req, res) => {
  try {
    const { orderId, amount, cardNumber, expiryMonth, expiryYear, cvc, zip } =
      req.body;

    console.log("Processing Stripe payment for order:", orderId);

    // SECURITY: Validate order ownership
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (order.orderStatus !== "payment_pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not available for payment",
      });
    }

    // FIXED: Proper amount validation
    const orderTotal = parseFloat(order.totalAmount);
    const paymentAmount = parseFloat(amount);

    console.log("💰 Payment details:", {
      orderId,
      amount,
      amountType: typeof amount,
    });

    console.log("💰 Amount comparison:", {
      orderTotal: order.totalAmount,
      orderTotalType: typeof order.totalAmount,
      paymentAmount: parseFloat(amount),
      paymentAmountType: typeof parseFloat(amount),
      isEqual: parseFloat(amount) === order.totalAmount,
    });

    if (paymentAmount !== orderTotal) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match order total",
        expected: orderTotal,
        received: paymentAmount,
      });
    }

    // For test cards, simulate payment processing
    const testCards = [
      "4242424242424242",
      "5555555555554444",
      "4000056655665556",
    ];
    const declineCards = ["4000000000000002", "4000000000009995"];

    if (testCards.includes(cardNumber)) {
      // Simulate successful payment
      const paymentInfo = {
        id: `stripe_sim_${Date.now()}`,
        status: "succeeded",
        update_time: new Date().toISOString(),
        email_address: req.user.email,
        amount_paid: paymentAmount, // ✅ Store in LKR
        card_last4: cardNumber.slice(-4),
      };

      const confirmedOrder = await confirmOrderPayment(orderId, paymentInfo);

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        orderId: confirmedOrder._id,
      });
    } else if (declineCards.includes(cardNumber)) {
      await cancelPaymentPendingOrder(orderId);
      res.status(400).json({
        success: false,
        message: "Your card was declined",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Please use a valid test card number",
      });
    }
  } catch (error) {
    console.error("Stripe payment processing error:", error);
    res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Payment service error",
    });
  }
};

// Update the module exports
module.exports = {
  createStripePaymentIntent,
  confirmStripePayment,
  createPayHerePayment,
  payHereNotification,
  processCODOrder,
  getPaymentStatus,
  processStripePayment, // Add this
};
