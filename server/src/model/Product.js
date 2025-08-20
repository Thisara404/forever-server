const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Remove custom _id, let MongoDB generate ObjectIds
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be positive']
  },
  image: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Men', 'Women', 'Kids']
  },
  subCategory: {
    type: String,
    required: [true, 'Sub-category is required'],
    enum: ['Topwear', 'Bottomwear', 'Winterwear']
  },
  sizes: [{
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL']
  }],
  bestseller: {
    type: Boolean,
    default: false
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 100,
    min: [0, 'Stock quantity cannot be negative']
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  sku: {
    type: String,
    unique: true
  },
  // Add legacy ID for reference
  legacyId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ bestseller: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ legacyId: 1 });

module.exports = mongoose.model('Product', productSchema);