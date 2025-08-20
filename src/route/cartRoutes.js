const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controller/cartController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, getCart);

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', auth, addToCart);

// @route   PUT /api/cart/update
// @desc    Update cart item quantity
// @access  Private
router.put('/update', auth, updateCartItem);

// @route   DELETE /api/cart/remove
// @desc    Remove item from cart
// @access  Private
router.delete('/remove', auth, removeFromCart);

// @route   DELETE /api/cart/clear
// @desc    Clear cart
// @access  Private
router.delete('/clear', auth, clearCart);

module.exports = router;