require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../model/Product');
const Cart = require('../model/Cart');

const completeReset = async () => {
  try {
    console.log('🚀 Starting complete database reset...');
    
    await mongoose.connect(process.env.MongoDB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear all products
    const productResult = await Product.deleteMany({});
    console.log(`🗑️ Cleared ${productResult.deletedCount} products`);
    
    // Clear all carts
    const cartResult = await Cart.deleteMany({});
    console.log(`🗑️ Cleared ${cartResult.deletedCount} carts`);
    
    // Now run the seeder
    console.log('🌱 Running seeder...');
    const DatabaseSeeder = require('./seedWithR2Images');
    const seeder = new DatabaseSeeder();
    await seeder.seedProducts(false); // Don't clear again since we just did
    
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    console.log('✅ Complete reset finished successfully!');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  completeReset();
}

module.exports = { completeReset };