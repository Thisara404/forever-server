require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('../model/Cart');

const clearInvalidCartData = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find carts with null productId references
    const invalidCarts = await Cart.find({
      'items.productId': null
    });
    
    console.log(`Found ${invalidCarts.length} carts with invalid product references`);
    
    // Remove items with null productId from all carts
    const result = await Cart.updateMany(
      {},
      {
        $pull: {
          items: { productId: null }
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} carts`);
    
    // Remove empty carts
    const emptyCartsResult = await Cart.deleteMany({
      $or: [
        { items: { $size: 0 } },
        { items: { $exists: false } }
      ]
    });
    
    console.log(`Removed ${emptyCartsResult.deletedCount} empty carts`);
    
    await mongoose.connection.close();
    console.log('✅ Invalid cart data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing invalid cart data:', error);
  }
};

if (require.main === module) {
  clearInvalidCartData();
}

module.exports = { clearInvalidCartData };