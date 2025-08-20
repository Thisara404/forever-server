const Order = require('../model/Order');

// Clean up payment pending orders older than 30 minutes
const cleanupAbandonedOrders = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const result = await Order.updateMany(
      {
        orderStatus: 'payment_pending',
        createdAt: { $lt: thirtyMinutesAgo }
      },
      {
        orderStatus: 'cancelled',
        'paymentInfo.status': 'abandoned',
        'paymentInfo.cancelled_at': new Date().toISOString()
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned up ${result.modifiedCount} abandoned orders`);
    }

  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupAbandonedOrders, 10 * 60 * 1000);

module.exports = { cleanupAbandonedOrders };