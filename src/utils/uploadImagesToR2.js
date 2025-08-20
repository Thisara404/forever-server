require('dotenv').config();
const { uploadImage } = require('../config/r2');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadProductImages = async () => {
  try {
    console.log('🚀 Starting upload of product images to Cloudflare R2...');
    
    // Path to your product images
    const assetsPath = path.join(__dirname, '../../assets/product_images');
    
    // Check if assets directory exists
    if (!fs.existsSync(assetsPath)) {
      console.log(`❌ Assets directory not found: ${assetsPath}`);
      console.log('📁 Please create the directory and add product images.');
      return;
    }
    
    // Get all image files
    const files = fs.readdirSync(assetsPath).filter(file => 
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    );
    
    if (files.length === 0) {
      console.log('❌ No image files found in assets directory');
      console.log('📝 Please add product images (.jpg, .png, .webp) to:', assetsPath);
      return;
    }
    
    console.log(`📦 Found ${files.length} images to upload`);
    
    const uploadResults = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(assetsPath, file);
        const fileName = path.parse(file).name; // Remove extension
        
        console.log(`📤 Uploading ${file}...`);
        
        // Read file as buffer
        const fileBuffer = fs.readFileSync(filePath);
        
        // Use original filename for consistency
        const r2FileName = `${fileName}.jpg`;
        
        // Upload to R2
        const result = await uploadImage(fileBuffer, r2FileName, 'products');
        
        uploadResults.push({
          originalName: file,
          fileName: fileName,
          r2Url: result.secure_url,
          r2Key: result.public_id
        });
        
        successCount++;
        console.log(`✅ Uploaded: ${file} -> ${result.secure_url}`);
        
        // Small delay to avoid overwhelming the service
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to upload ${file}:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successfully uploaded: ${successCount} images`);
    console.log(`❌ Failed uploads: ${failCount} images`);
    
    if (uploadResults.length > 0) {
      // Save mapping to JSON file
      const mappingPath = path.join(__dirname, 'r2-image-mapping.json');
      fs.writeFileSync(mappingPath, JSON.stringify(uploadResults, null, 2));
      console.log(`📝 Image mapping saved to: ${mappingPath}`);
      
      // Generate seed file
      generateSeedFileWithR2URLs(uploadResults);
    }
    
    return uploadResults;
    
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

const generateSeedFileWithR2URLs = (uploadResults) => {
  // Create a mapping from filename to URL
  const imageMap = {};
  uploadResults.forEach(result => {
    imageMap[result.fileName] = result.r2Url;
  });
  
  const seedFilePath = path.join(__dirname, 'seedWithR2Images.js');
  
  const seedFileContent = `require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../model/Product');

// Product data with R2 URLs
const productsData = [
  {
    legacyId: "aaaaa",
    name: "Women Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 100,
    image: ["${imageMap['p_img1'] || 'https://via.placeholder.com/800x800/db2777/FFFFFF?text=Women+1'}"],
    category: "Women",
    subCategory: "Topwear",
    sizes: ["S", "M", "L"],
    date: 1716634345448,
    bestseller: true
  },
  {
    legacyId: "aaaab",
    name: "Men Round Neck Pure Cotton T-shirt",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 200,
    image: [
      "${imageMap['p_img2_1'] || imageMap['p_img2'] || 'https://via.placeholder.com/800x800/1e40af/FFFFFF?text=Men+2-1'}",
      "${imageMap['p_img2_2'] || imageMap['p_img2'] || 'https://via.placeholder.com/800x800/1e40af/FFFFFF?text=Men+2-2'}",
      "${imageMap['p_img2_3'] || imageMap['p_img2'] || 'https://via.placeholder.com/800x800/1e40af/FFFFFF?text=Men+2-3'}",
      "${imageMap['p_img2_4'] || imageMap['p_img2'] || 'https://via.placeholder.com/800x800/1e40af/FFFFFF?text=Men+2-4'}"
    ],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["M", "L", "XL"],
    date: 1716621345448,
    bestseller: true
  },
  {
    legacyId: "aaaac",
    name: "Girls Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 220,
    image: ["${imageMap['p_img3'] || 'https://via.placeholder.com/800x800/059669/FFFFFF?text=Kids+3'}"],
    category: "Kids",
    subCategory: "Topwear",
    sizes: ["S", "L", "XL"],
    date: 1716234545448,
    bestseller: true
  },
  {
    legacyId: "aaaad",
    name: "Men Round Neck Pure Cotton T-shirt",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 180,
    image: ["${imageMap['p_img4'] || 'https://via.placeholder.com/800x800/1e40af/FFFFFF?text=Men+4'}"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1716621345448,
    bestseller: false
  },
  {
    legacyId: "aaaae",
    name: "Women Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 160,
    image: ["${imageMap['p_img5'] || 'https://via.placeholder.com/800x800/db2777/FFFFFF?text=Women+5'}"],
    category: "Women",
    subCategory: "Topwear",
    sizes: ["M", "L", "XL"],
    date: 1716634345448,
    bestseller: false
  },
  {
    legacyId: "aaaaf",
    name: "Girls Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 170,
    image: ["${imageMap['p_img6'] || 'https://via.placeholder.com/800x800/059669/FFFFFF?text=Kids+6'}"],
    category: "Kids",
    subCategory: "Topwear",
    sizes: ["S", "L", "XL"],
    date: 1716234545448,
    bestseller: false
  },
  {
    legacyId: "aaaag",
    name: "Men Tapered Fit Flat-Front Trousers",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 190,
    image: ["${imageMap['p_img7'] || 'https://via.placeholder.com/800x800/1e40af/FFFFFF?text=Men+7'}"],
    category: "Men",
    subCategory: "Bottomwear",
    sizes: ["S", "L", "XL"],
    date: 1716621345448,
    bestseller: false
  },
  {
    legacyId: "aaaah",
    name: "Men Round Neck Pure Cotton T-shirt",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 140,
    image: ["${imageMap['p_img8'] || 'https://via.placeholder.com/800x800/1e40af/FFFFFF?text=Men+8'}"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "M", "L", "XL"],
    date: 1716621345448,
    bestseller: false
  },
  {
    legacyId: "aaaai",
    name: "Girls Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 100,
    image: ["${imageMap['p_img9'] || 'https://via.placeholder.com/800x800/059669/FFFFFF?text=Kids+9'}"],
    category: "Kids",
    subCategory: "Topwear",
    sizes: ["M", "L", "XL"],
    date: 1716234545448,
    bestseller: false
  },
  {
    legacyId: "aaaaj",
    name: "Men Tagged Slim Fit Casual Shirt",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 110,
    image: ["${imageMap['p_img10'] || 'https://via.placeholder.com/800x800/1e40af/FFFFFF?text=Men+10'}"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["S", "L", "XL"],
    date: 1716621345448,
    bestseller: false
  }
];

// Generate additional products from remaining images
${generateAdditionalProducts(imageMap)}

class DatabaseSeeder {
  constructor() {
    this.totalProducts = 0;
    this.successCount = 0;
    this.failedProducts = [];
  }

  async connectDB() {
    try {
      const conn = await mongoose.connect(process.env.MongoDB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(\`✅ MongoDB Connected: \${conn.connection.host}\`);
      return true;
    } catch (error) {
      console.error(\`❌ Database connection failed: \${error.message}\`);
      return false;
    }
  }

  async clearExistingData() {
    try {
      const deletedCount = await Product.deleteMany({});
      console.log(\`🗑️  Cleared \${deletedCount.deletedCount} existing products\`);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear existing data:', error.message);
      return false;
    }
  }

  async seedProducts(clearFirst = true) {
    try {
      console.log('🌱 Starting database seeding with R2 images...');
      
      if (clearFirst) {
        const cleared = await this.clearExistingData();
        if (!cleared) return false;
      }

      this.totalProducts = productsData.length;
      console.log(\`📦 Processing \${this.totalProducts} products...\`);

      const batchSize = 20;
      
      for (let i = 0; i < productsData.length; i += batchSize) {
        const batch = productsData.slice(i, i + batchSize);
        const transformedBatch = [];

        for (const product of batch) {
          try {
            const enhancedProduct = this.generateEnhancedProductData(product);
            transformedBatch.push(enhancedProduct);
          } catch (error) {
            console.error(\`⚠️  Failed to transform product \${product.name}:\`, error);
            this.failedProducts.push(product.name);
          }
        }

        if (transformedBatch.length > 0) {
          await Product.insertMany(transformedBatch);
          this.successCount += transformedBatch.length;
          
          const progress = ((i + batchSize) / productsData.length * 100).toFixed(1);
          console.log(\`📈 Progress: \${this.successCount}/\${this.totalProducts} products (\${progress}%)\`);
        }
      }

      console.log(\`✅ Successfully seeded \${this.successCount} products with R2 images!\`);
      return true;
    } catch (error) {
      console.error('❌ Seeding process failed:', error);
      return false;
    }
  }

  generateEnhancedProductData(product) {
    const generateStock = (category, bestseller) => {
      const baseStock = bestseller ? 50 : 30;
      const variance = Math.floor(Math.random() * 20) - 10;
      return Math.max(baseStock + variance, 10);
    };

    const enhancePrice = (basePrice, category, subCategory, bestseller) => {
      let multiplier = 1;
      
      if (category === 'Women') multiplier += 0.1;
      if (subCategory === 'Winterwear') multiplier += 0.2;
      if (bestseller) multiplier += 0.15;
      
      return Math.round(basePrice * multiplier);
    };

    const generateTags = (name, category, subCategory) => {
      const baseTags = [name.toLowerCase(), category.toLowerCase(), subCategory.toLowerCase()];
      const additionalTags = ['fashion', 'clothing', 'style'];
      return [...baseTags, ...additionalTags];
    };

    const generateRatingData = (bestseller) => {
      if (bestseller) {
        return {
          rating: 4.0 + Math.random() * 1,
          reviewCount: Math.floor(Math.random() * 50) + 20
        };
      } else {
        return {
          rating: 3.0 + Math.random() * 2,
          reviewCount: Math.floor(Math.random() * 20) + 5
        };
      }
    };

    const { rating, reviewCount } = generateRatingData(product.bestseller);

    return {
      ...product,
      price: enhancePrice(product.price, product.category, product.subCategory, product.bestseller),
      stockQuantity: generateStock(product.category, product.bestseller),
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      tags: generateTags(product.name, product.category, product.subCategory),
      sku: \`SKU-\${product.legacyId}-\${Date.now()}\`,
      discount: product.bestseller ? Math.floor(Math.random() * 20) + 5 : 0
    };
  }

  async run() {
    try {
      console.log('🚀 Starting database seeding with R2 images...');
      const connected = await this.connectDB();
      if (!connected) return;
      
      await this.seedProducts();
      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error.message);
    } finally {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    }
  }
}

// Export for programmatic use
module.exports = DatabaseSeeder;

// Run if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.run();
}
`;

  fs.writeFileSync(seedFilePath, seedFileContent);
  console.log(`\n📄 Generated seed file with R2 URLs: ${seedFilePath}`);
};

function generateAdditionalProducts(imageMap) {
  const products = [];
  const productImages = Object.keys(imageMap).filter(key => key.startsWith('p_img') && !['p_img2_1', 'p_img2_2', 'p_img2_3', 'p_img2_4'].includes(key));
  
  for (let i = 11; i <= 52; i++) {
    const imgKey = `p_img${i}`;
    if (imageMap[imgKey]) {
      const categories = ['Men', 'Women', 'Kids'];
      const subCategories = ['Topwear', 'Bottomwear', 'Winterwear'];
      const category = categories[(i - 1) % 3];
      const subCategory = subCategories[(i - 1) % 3];
      
      products.push(`  {
    legacyId: "product${i}",
    name: "${category} ${subCategory} Product ${i}",
    description: "A high-quality ${category.toLowerCase()} ${subCategory.toLowerCase()} with excellent features and comfortable design.",
    price: ${Math.floor(Math.random() * 200) + 100},
    image: ["${imageMap[imgKey]}"],
    category: "${category}",
    subCategory: "${subCategory}",
    sizes: ["S", "M", "L", "XL"],
    date: ${Date.now() - (i * 100000)},
    bestseller: ${i <= 15 ? 'true' : 'false'}
  }`);
    }
  }
  
  return `
// Additional products from uploaded images
const additionalProducts = [
${products.join(',\n')}
];

productsData.push(...additionalProducts);
`;
}

// Run if called directly
if (require.main === module) {
  uploadProductImages();
}

module.exports = { uploadProductImages };