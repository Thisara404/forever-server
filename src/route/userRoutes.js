const express = require('express');
const {
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controller/userController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

// @route   POST /api/users/addresses
// @desc    Add shipping address
// @access  Private
router.post('/addresses', auth, addAddress);

// @route   PUT /api/users/addresses/:addressId
// @desc    Update shipping address
// @access  Private
router.put('/addresses/:addressId', auth, updateAddress);

// @route   DELETE /api/users/addresses/:addressId
// @desc    Delete shipping address
// @access  Private
router.delete('/addresses/:addressId', auth, deleteAddress);

module.exports = router;