const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAnalytics
} = require('../controller/adminController');
const { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controller/productController');
const { adminAuth } = require('../middleware/Auth');
const { uploadMultiple } = require('../middleware/upload');
const { validateProduct } = require('../utils/validation');
const parseFormData = require('../middleware/parseFormData');

const router = express.Router();

// Debug middleware for dashboard stats
router.get('/dashboard/stats', (req, res, next) => {
  console.log('🛠️ [DEBUG] Incoming request to /api/admin/dashboard/stats');
  next();
}, adminAuth, async (req, res, next) => {
  console.log('🛠️ [DEBUG] Passed adminAuth, user:', req.user);
  next();
}, getDashboardStats);

// User management routes
router.get('/users', adminAuth, getAllUsers);
router.put('/users/:userId/status', adminAuth, updateUserStatus);

// Analytics routes
router.get('/analytics', adminAuth, getAnalytics);

// Product management routes (Admin only)
router.get('/products', adminAuth, getProducts);
router.post('/products', 
  adminAuth, 
  uploadMultiple, 
  parseFormData, 
  validateProduct, 
  createProduct
);
router.put('/products/:id', 
  adminAuth, 
  uploadMultiple, 
  parseFormData, 
  updateProduct
);
router.delete('/products/:id', adminAuth, deleteProduct);

module.exports = router;