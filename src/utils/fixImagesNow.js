require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../model/Product');
const Cart = require('../model/Cart');

const fixImagesNow = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_URI);
    console.log('🚀 Quick fixing images...');
    
    // Clear problematic data
    await Cart.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    // Create products with CDN images that actually work
    const products = [];
    
    for (let i = 1; i <= 52; i++) {
      const categories = ['Men', 'Women', 'Kids'];
      const subCategories = ['Topwear', 'Bottomwear', 'Winterwear'];
      const category = categories[(i - 1) % 3];
      const subCategory = subCategories[(i - 1) % 3];
      
      // Use picsum.photos for actual working images
      const imageId = 200 + i; // Different image for each product
      
      products.push({
        name: `${category} ${subCategory} Product ${i}`,
        description: `A premium ${category.toLowerCase()} ${subCategory.toLowerCase()} crafted with attention to detail and comfort.`,
        price: Math.floor(Math.random() * 300) + 100,
        image: [
          `https://picsum.photos/800/800?random=${imageId}`,
          `https://picsum.photos/800/800?random=${imageId + 100}`
        ],
        category: category,
        subCategory: subCategory,
        sizes: ["S", "M", "L", "XL"],
        bestseller: i <= 15,
        stockQuantity: Math.floor(Math.random() * 50) + 20,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 50) + 10,
        inStock: true,
        sku: `FOREVER-${category.toUpperCase()}-${i.toString().padStart(3, '0')}`,
        tags: [category.toLowerCase(), subCategory.toLowerCase(), 'fashion', 'clothing'],
        discount: i <= 10 ? Math.floor(Math.random() * 30) + 10 : 0
      });
    }
    
    await Product.insertMany(products);
    console.log(`✅ Created ${products.length} products with working images!`);
    
    await mongoose.connection.close();
    console.log('✅ Your website should now show products with images!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
};

fixImagesNow();