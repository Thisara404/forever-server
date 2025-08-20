const express = require('express');
const {
  createStripePaymentIntent,
  confirmStripePayment,
  createPayHerePayment,
  payHereNotification,
  processCODOrder,
  getPaymentStatus
} = require('../controller/paymentController');
const { auth } = require('../middleware/Auth');

const router = express.Router();

// Stripe routes (for international customers)
router.post('/stripe/create-payment-intent', auth, createStripePaymentIntent);
router.post('/stripe/confirm', auth, confirmStripePayment);

// PayHere routes (primary for Sri Lanka)
router.post('/payhere/create-payment', auth, createPayHerePayment);
router.post('/payhere/notify', payHereNotification); // Public webhook

// COD routes
router.post('/cod/process', auth, processCODOrder);

// Payment status
router.get('/status/:orderId', auth, getPaymentStatus);

module.exports = router;