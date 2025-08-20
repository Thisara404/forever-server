require('dotenv').config();
const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const testR2Credentials = async () => {
  console.log('🧪 Testing R2 Credentials...\n');
  
  // Log current credentials (masked)
  console.log('Current Configuration:');
  console.log(`Account ID: ${process.env.CLOUDFLARE_ACCOUNT_ID}`);
  console.log(`Access Key: ${process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? process.env.CLOUDFLARE_R2_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`Secret Key: ${process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '***set***' : 'NOT SET'}`);
  console.log(`Bucket: ${process.env.CLOUDFLARE_R2_BUCKET_NAME}`);
  console.log(`Endpoint: ${process.env.CLOUDFLARE_R2_ENDPOINT}\n`);

  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Test 1: List buckets (this tests credentials)
    console.log('📋 Test 1: Listing buckets...');
    const listCommand = new ListBucketsCommand({});
    const listResult = await client.send(listCommand);
    
    console.log('✅ Credentials are valid!');
    console.log('Available buckets:', listResult.Buckets?.map(b => b.Name) || []);
    
    // Check if our bucket exists
    const bucketExists = listResult.Buckets?.some(b => b.Name === process.env.CLOUDFLARE_R2_BUCKET_NAME);
    
    if (bucketExists) {
      console.log(`✅ Bucket "${process.env.CLOUDFLARE_R2_BUCKET_NAME}" exists!`);
    } else {
      console.log(`❌ Bucket "${process.env.CLOUDFLARE_R2_BUCKET_NAME}" not found!`);
      console.log('📝 Please create the bucket in Cloudflare dashboard first.');
      return false;
    }

    // Test 2: Upload a small test file
    console.log('\n📤 Test 2: Testing upload...');
    const testContent = Buffer.from('Hello R2!', 'utf8');
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: 'test/connection-test.txt',
      Body: testContent,
      ContentType: 'text/plain'
    });

    await client.send(uploadCommand);
    console.log('✅ Upload test successful!');
    
    console.log('\n🎉 All tests passed! R2 is configured correctly.');
    return true;

  } catch (error) {
    console.error('❌ R2 test failed:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode
    });

    // Provide specific error guidance
    if (error.code === 'InvalidAccessKeyId') {
      console.log('\n💡 Solution: Your Access Key ID is invalid. Please create a new R2 API token.');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.log('\n💡 Solution: Your Secret Access Key is invalid. Please create a new R2 API token.');
    } else if (error.code === 'NoSuchBucket') {
      console.log('\n💡 Solution: Create the bucket in Cloudflare dashboard first.');
    } else {
      console.log('\n💡 Solution: Check your R2 configuration and credentials.');
    }
    
    return false;
  }
};

if (require.main === module) {
  testR2Credentials();
}

module.exports = { testR2Credentials };