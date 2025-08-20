require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../model/Product');
const Cart = require('../model/Cart');

const completeImageFix = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_URI);
    console.log('🚀 Starting complete image fix...');
    
    // Clear all products and carts
    await Product.deleteMany({});
    await Cart.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    // Create products with working placeholder images for now
    const sampleProducts = [];
    
    // Generate 52 products with working placeholder images
    for (let i = 1; i <= 52; i++) {
      const categories = ['Men', 'Women', 'Kids'];
      const subCategories = ['Topwear', 'Bottomwear', 'Winterwear'];
      const category = categories[(i - 1) % 3];
      const subCategory = subCategories[(i - 1) % 3];
      
      const colors = {
        'Men': '1e40af',
        'Women': 'db2777', 
        'Kids': '059669'
      };
      
      sampleProducts.push({
        name: `${category} ${subCategory} Product ${i}`,
        description: `A high-quality ${category.toLowerCase()} ${subCategory.toLowerCase()} with excellent features and comfortable design.`,
        price: Math.floor(Math.random() * 200) + 100,
        image: [`https://via.placeholder.com/800x800/${colors[category]}/FFFFFF?text=${category}+${i}`],
        category: category,
        subCategory: subCategory,
        sizes: ["S", "M", "L", "XL"],
        bestseller: i <= 15,
        stockQuantity: Math.floor(Math.random() * 50) + 20,
        rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 30) + 5,
        inStock: true,
        sku: `SKU-${Date.now()}-${i}`
      });
    }
    
    await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${sampleProducts.length} products with working placeholder images`);
    
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    console.log('✅ Complete image fix finished! Your products should now display with images.');
    
  } catch (error) {
    console.error('❌ Image fix failed:', error);
  }
};

completeImageFix();