const Order = require("../model/Order");
const Cart = require("../model/Cart");
const Product = require("../model/Product");
const { validationResult } = require("express-validator");
const {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
} = require("../utils/sendEmail");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { items, shippingAddress, paymentMethod, paymentInfo } = req.body;

    // Calculate order totals and verify stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`,
        });
      }

      if (!product.inStock) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is out of stock`,
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        size: item.size,
        quantity: item.quantity,
        image: product.image[0],
      });
    }

    const shippingFee = 10; // Fixed shipping fee
    const totalAmount = subtotal + shippingFee;

    // **NEW: Set order status based on payment method**
    let orderStatus;
    let isPaid;
    let shouldUpdateInventory = false;

    switch (paymentMethod) {
      case "cod":
        orderStatus = "confirmed"; // COD orders are confirmed immediately
        isPaid = false;
        shouldUpdateInventory = true; // Reserve stock for COD
        break;

      case "stripe":
      case "payhere":
        orderStatus = "payment_pending"; // Wait for payment confirmation
        isPaid = false;
        shouldUpdateInventory = false; // Don't reserve stock until payment is confirmed
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
    }

    // Create order with appropriate status
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentInfo: paymentInfo || {},
      subtotal,
      shippingFee,
      totalAmount,
      orderStatus,
      isPaid,
      paidAt: null,
    });

    // Only update inventory for COD orders
    if (shouldUpdateInventory) {
      await updateInventory(orderItems);

      // Clear user's cart for COD
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { items: [], totalAmount: 0, totalItems: 0 }
      );

      // Send order confirmation email for COD
      try {
        await sendOrderConfirmationEmail(req.user.email, order);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    console.log(
      `✅ Order created with status: ${orderStatus} for payment method: ${paymentMethod}`
    );

    // SECURITY FIX: Return sanitized order data without sensitive info
    const sanitizedOrder = {
      _id: order._id,
      items: order.items.map((item) => ({
        name: item.name,
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        image: item.image,
      })),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      isPaid: order.isPaid,
      createdAt: order.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: sanitizedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating order",
    });
  }
};

// **NEW: Function to confirm payment and update order**
const confirmOrderPayment = async (orderId, paymentInfo) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.orderStatus !== "payment_pending") {
      throw new Error("Order is not in payment pending status");
    }

    // Update order status to confirmed
    order.orderStatus = "confirmed";
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentInfo = paymentInfo;

    await order.save();

    // Now update inventory since payment is confirmed
    await updateInventory(order.items);

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: order.userId },
      { items: [], totalAmount: 0, totalItems: 0 }
    );

    // Send confirmation email
    try {
      const User = require("../model/User");
      const user = await User.findById(order.userId);
      await sendOrderConfirmationEmail(user.email, order);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    console.log(`✅ Order ${orderId} payment confirmed and inventory updated`);
    return order;
  } catch (error) {
    console.error("Order payment confirmation error:", error);
    throw error;
  }
};

// **NEW: Function to cancel payment pending orders**
const cancelPaymentPendingOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.orderStatus === "payment_pending") {
      order.orderStatus = "cancelled";
      order.paymentInfo = {
        ...order.paymentInfo,
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      };
      await order.save();
      console.log(`❌ Order ${orderId} cancelled due to payment failure`);
    }

    return order;
  } catch (error) {
    console.error("Order cancellation error:", error);
    throw error;
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build filter - exclude payment_pending orders for regular users
    const filter = { userId: req.user._id };
    if (status) {
      filter.orderStatus = status;
    } else {
      // By default, exclude payment_pending orders from user view
      filter.orderStatus = { $ne: "payment_pending" };
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("items.productId", "name image");

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.productId",
      "name image category subCategory"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to user (unless admin)
    if (
      order.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching order",
    });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id).populate(
      "userId",
      "email"
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const previousStatus = order.orderStatus;

    // Update order status
    order.orderStatus = orderStatus;

    // Set delivered date if status is delivered
    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
    }

    // Handle cancelled orders - restore inventory
    if (orderStatus === "cancelled" && previousStatus !== "cancelled") {
      await restoreInventory(order.items);
    }

    await order.save();

    // Send status update email
    try {
      await sendOrderStatusUpdateEmail(order.userId.email, order);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating order status",
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to user (unless admin)
    if (
      order.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if order can be cancelled
    if (
      order.orderStatus === "delivered" ||
      order.orderStatus === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling order",
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      search,
      includePending = false,
    } = req.query;

    console.log("📋 Admin getAllOrders called with params:", {
      page,
      limit,
      status,
      userId,
      search,
      includePending,
    });

    // Build filter to exclude payment_pending by default
    const filter = {};

    if (includePending !== "true") {
      filter.orderStatus = { $ne: "payment_pending" };
    }

    if (status && status !== "payment_pending") {
      filter.orderStatus = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    // FIXED: Improved search functionality with better error handling
    if (search && search.trim()) {
      const searchTerm = search.trim();
      console.log("🔍 Searching for:", searchTerm);

      try {
        // Create search conditions
        const searchConditions = [];

        // Search by order ID (if it looks like a MongoDB ObjectId or partial match)
        if (searchTerm.length >= 3) {
          searchConditions.push({ _id: { $regex: searchTerm, $options: "i" } });
        }

        // Search by shipping address fields (with escaped special characters)
        const escapedSearchTerm = searchTerm.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        searchConditions.push(
          {
            "shippingAddress.firstName": {
              $regex: escapedSearchTerm,
              $options: "i",
            },
          },
          {
            "shippingAddress.lastName": {
              $regex: escapedSearchTerm,
              $options: "i",
            },
          },
          {
            "shippingAddress.email": {
              $regex: escapedSearchTerm,
              $options: "i",
            },
          },
          {
            "shippingAddress.phone": {
              $regex: escapedSearchTerm,
              $options: "i",
            },
          }
        );

        filter.$or = searchConditions;
      } catch (searchError) {
        console.error("Search regex error:", searchError);
        // If regex fails, fall back to simple text search
        filter["shippingAddress.firstName"] = {
          $regex: searchTerm,
          $options: "i",
        };
      }
    }

    console.log("📋 Final filter:", JSON.stringify(filter, null, 2));

    const skip = (page - 1) * limit;

    // Execute the query with error handling
    let orders, totalOrders;

    try {
      orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("userId", "name email")
        .populate("items.productId", "name image");

      totalOrders = await Order.countDocuments(filter);
    } catch (queryError) {
      console.error("MongoDB query error:", queryError);

      // If the search query fails, try without search
      if (search) {
        console.log("🔄 Retrying without search due to query error...");
        delete filter.$or;
        delete filter["shippingAddress.firstName"];

        orders = await Order.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate("userId", "name email")
          .populate("items.productId", "name image");

        totalOrders = await Order.countDocuments(filter);
      } else {
        throw queryError;
      }
    }

    const totalPages = Math.ceil(totalOrders / limit);

    console.log(`📋 Found ${orders.length} orders (${totalOrders} total)`);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper function to update inventory
const updateInventory = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stockQuantity: -item.quantity },
    });

    const product = await Product.findById(item.productId);
    if (product.stockQuantity <= 0) {
      product.inStock = false;
      await product.save();
    }
  }
};

// Helper function to restore inventory (for cancelled orders)
const restoreInventory = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stockQuantity: item.quantity },
      inStock: true,
    });
  }
};

// SECURITY FIX: Add order ownership validation middleware
const validateOrderOwnership = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    req.order = order;
    next();
  } catch (error) {
    console.error("Order validation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during order validation",
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  confirmOrderPayment,
  cancelPaymentPendingOrder,
  validateOrderOwnership, // Add this missing export
};
