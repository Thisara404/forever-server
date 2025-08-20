const Product = require('../model/Product');
const { validationResult } = require('express-validator');
const { uploadImage, deleteImage } = require('../config/r2');
const { v4: uuidv4 } = require('uuid');
const { broadcastUpdate } = require('../utils/websocket');

// Add this helper function at the top of productController.js
const invalidateProductCache = () => {
  // If you're using any caching, clear it here
  console.log('🗑️ Invalidating product cache...');
  // You can add Redis cache clearing here if using Redis
};

// @desc    Get all products with filtering and search
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subCategory,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      bestseller
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (subCategory) {
      filter.subCategory = subCategory;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (bestseller !== undefined) {
      filter.bestseller = bestseller === 'true';
    }

    // Only show in-stock products by default
    filter.inStock = true;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalProducts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
const createProduct = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('User:', req.user);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, price, category, subCategory, sizes, bestseller, stockQuantity } = req.body;

    // Handle image uploads to R2
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const fileName = `${uuidv4()}-${Date.now()}.jpg`;
          const uploadResult = await uploadImage(file.buffer, fileName, 'products');
          images.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images'
          });
        }
      }
    }

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Create the product
    const newProduct = await Product.create({
      name,
      description,
      price: Number(price),
      image: images,
      category,
      subCategory,
      sizes: Array.isArray(sizes) ? sizes : [sizes],
      bestseller: bestseller === 'true',
      stockQuantity: stockQuantity ? Number(stockQuantity) : 100,
      inStock: true,
      sku: `FOREVER-${Date.now()}`,
      tags: [name.toLowerCase(), category.toLowerCase(), subCategory.toLowerCase()]
    });

    // Broadcast the update
    broadcastUpdate('PRODUCT_CREATED', newProduct);

    // Invalidate cache after creating
    invalidateProductCache();

    console.log('✅ Product created successfully:', newProduct._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

    // Handle new image uploads
    let images = [...product.image]; // Keep existing images
    
    if (req.files && req.files.length > 0) {
      // Delete old images from R2
      for (const imageUrl of product.image) {
        try {
          const publicId = imageUrl.split('/').slice(-2).join('/'); // Extract path from URL
          await deleteImage(publicId);
        } catch (deleteError) {
          console.error('Failed to delete old image:', deleteError);
        }
      }

      // Upload new images
      images = [];
      for (const file of req.files) {
        try {
          const fileName = `${uuidv4()}-${Date.now()}.jpg`;
          const uploadResult = await uploadImage(file.buffer, fileName, 'products');
          images.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images'
          });
        }
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name || product.name,
        description: description || product.description,
        price: price ? Number(price) : product.price,
        image: images,
        category: category || product.category,
        subCategory: subCategory || product.subCategory,
        sizes: sizes || product.sizes,
        bestseller: bestseller !== undefined ? bestseller === 'true' : product.bestseller,
        tags: name ? [name.toLowerCase(), (category || product.category).toLowerCase(), (subCategory || product.subCategory).toLowerCase()] : product.tags
      },
      { new: true }
    );

    // Invalidate cache after updating
    invalidateProductCache();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from R2
    for (const imageUrl of product.image) {
      try {
        const publicId = imageUrl.split('/').slice(-2).join('/'); // Extract path from URL
        await deleteImage(publicId);
      } catch (deleteError) {
        console.error('Failed to delete image:', deleteError);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    // Invalidate cache after deleting
    invalidateProductCache();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};

// @desc    Get categories and subcategories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const subCategories = await Product.distinct('subCategory');

    res.status(200).json({
      success: true,
      data: {
        categories,
        subCategories
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
};

// @desc    Get featured/bestseller products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({ 
      bestseller: true, 
      inStock: true 
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured products'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getFeaturedProducts
};