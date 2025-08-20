const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser
} = require('../controller/authController');
const { auth } = require('../middleware/Auth'); // Fix: Use correct case
const {
  validateUserRegistration,
  validateUserLogin
} = require('../utils/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, loginUser);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, getUserProfile);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, logoutUser);

module.exports = router;