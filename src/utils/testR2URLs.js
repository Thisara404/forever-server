require('dotenv').config();

const testNewR2URL = async () => {
  console.log('🧪 Testing new R2 Public Development URL...');
  
  // The new public URL format will be something like:
  // https://pub-xxxxx.r2.dev/products/p_img1.jpg
  
  const newPublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  console.log('Current PUBLIC_URL:', newPublicUrl);
  
  if (!newPublicUrl || newPublicUrl.includes('e224e7df38b932351e1c9ed0cc3d9df9.r2.cloudflarestorage.com')) {
    console.log('❌ You need to update CLOUDFLARE_R2_PUBLIC_URL with the new pub-xxxxx.r2.dev URL');
    console.log('💡 Go to Cloudflare R2 dashboard and click "Enable" for Public Development URL');
    return;
  }
  
  // Test a sample image URL
  const testImageUrl = `${newPublicUrl}/products/p_img1.jpg`;
  console.log('Testing URL:', testImageUrl);
  
  try {
    const https = require('https');
    const request = https.get(testImageUrl, (response) => {
      console.log('Status:', response.statusCode);
      
      if (response.statusCode === 200) {
        console.log('✅ R2 images are now accessible!');
      } else {
        console.log('❌ Still getting error:', response.statusCode);
      }
      
      process.exit();
    });
    
    request.on('error', (error) => {
      console.log('❌ URL test failed:', error.message);
      process.exit();
    });
  } catch (error) {
    console.error('Error:', error);
  }
};

testNewR2URL();