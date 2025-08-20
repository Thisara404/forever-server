require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../model/Product');

const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_URI);
    console.log('✅ Connected to MongoDB');
    
    const productCount = await Product.countDocuments();
    console.log(`📦 Total products in database: ${productCount}`);
    
    if (productCount > 0) {
      const sampleProduct = await Product.findOne();
      console.log('\n📋 Sample product:');
      console.log(`Name: ${sampleProduct.name}`);
      console.log(`Price: ${sampleProduct.price}`);
      console.log(`Images: ${JSON.stringify(sampleProduct.image, null, 2)}`);
      console.log(`Category: ${sampleProduct.category}`);
      console.log(`Created: ${sampleProduct.createdAt}`);
      
      // Check if images are R2 URLs or placeholders
      const firstImage = sampleProduct.image[0];
      if (firstImage.includes('r2.cloudflarestorage.com')) {
        console.log('✅ Product has R2 image URL');
      } else if (firstImage.includes('placeholder')) {
        console.log('⚠️ Product has placeholder image URL');
      } else {
        console.log('❓ Product has unknown image format:', firstImage);
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
};

checkDatabase();