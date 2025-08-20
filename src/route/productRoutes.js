const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getFeaturedProducts
} = require('../controller/productController');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const { validateProduct } = require('../utils/validation');
const parseFormData = require('../middleware/parseFormData');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and search
// @access  Public
router.get('/', getProducts);

// @route   GET /api/products/categories
// @desc    Get all categories and subcategories
// @access  Public
router.get('/categories', getCategories);

// @route   GET /api/products/featured
// @desc    Get featured/bestseller products
// @access  Public
router.get('/featured', getFeaturedProducts);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin only)
router.post('/', 
  adminAuth, 
  uploadMultiple, 
  handleUploadError,
  parseFormData,  // Add this middleware
  validateProduct, 
  createProduct
);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', 
  adminAuth, 
  uploadMultiple, 
  handleUploadError,
  updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', adminAuth, deleteProduct);

module.exports = router;