const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');

// Validate environment variables first
const validateR2Config = () => {
  const required = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'CLOUDFLARE_R2_ENDPOINT'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ R2 configuration validated');
};

try {
  validateR2Config();
} catch (error) {
  console.error('❌ R2 configuration error:', error.message);
  process.exit(1);
}

// Configure R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2
});

// Configuration
const r2Config = {
  bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
  publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_ENDPOINT,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID
};

// Function to upload image to R2
const uploadImage = async (buffer, key, folder = 'products') => {
  try {
    console.log(`🔄 Processing image: ${key}`);
    
    // Process image with Sharp
    const processedBuffer = await sharp(buffer)
      .resize(800, 800, { 
        fit: 'cover',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const fullKey = `${folder}/${key}`;
    
    console.log(`📤 Uploading to R2: ${fullKey}`);
    
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: fullKey,
      Body: processedBuffer,
      ContentType: 'image/jpeg',
      Metadata: {
        'original-name': key,
        'upload-date': new Date().toISOString()
      }
    });

    const result = await r2Client.send(command);
    
    // Return the public URL
    const publicUrl = `${r2Config.publicUrl}/${fullKey}`;
    
    console.log(`✅ Upload successful: ${publicUrl}`);
    
    return {
      secure_url: publicUrl,
      public_id: fullKey,
      url: publicUrl,
      etag: result.ETag
    };
  } catch (error) {
    console.error('R2 upload error:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Function to delete image from R2
const deleteImage = async (publicId) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: publicId
    });

    const result = await r2Client.send(command);
    return result;
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

// Function to generate presigned URL for direct upload
const generatePresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      ContentType: 'image/jpeg'
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

module.exports = {
  r2Client,
  r2Config,
  uploadImage,
  deleteImage,
  generatePresignedUrl
};