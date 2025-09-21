const express = require("express");
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  validateOrderOwnership, // Add this
} = require("../controller/orderController");
const { auth, adminAuth } = require("../middleware/auth");
const { validateOrder } = require("../utils/validation");

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post("/", auth, validateOrder, createOrder);

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get("/", auth, getUserOrders);

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private (Admin only)
router.get("/admin/all", adminAuth, getAllOrders);

// SECURITY: Add ownership validation to order access
// @route   GET /api/orders/:orderId
// @desc    Get single order by ID
// @access  Private
router.get("/:orderId", auth, validateOrderOwnership, getOrderById);

// @route   PUT /api/orders/:orderId/status
// @desc    Update order status (Admin only)
// @access  Private (Admin only)
router.put("/:orderId/status", adminAuth, updateOrderStatus);

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.put("/:orderId/cancel", auth, validateOrderOwnership, cancelOrder);

module.exports = router;
