const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Load environment variables
dotenv.config();

// Test Stripe configuration on startup
if (process.env.STRIPE_SECRET_KEY) {
  console.log('✅ Stripe configuration loaded');
} else {
  console.log('❌ Stripe secret key not found');
}

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// UPDATED Rate limiting - Make it less restrictive and skip health checks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased from 1000 to 2000
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip health checks from rate limiting
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health';
  },
});

// CORS middleware - FIXED formatting
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
}));

// Add preflight handling
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// UPDATED: Apply rate limiting to API routes but exclude health check
app.use('/api/', (req, res, next) => {
  if (req.path === '/health') {
    return next(); // Skip rate limiting for health check
  }
  return limiter(req, res, next);
});

// Import routes
const authRoutes = require('./src/route/authRoutes');
const productRoutes = require('./src/route/productRoutes');
const cartRoutes = require('./src/route/cartRoutes');
const orderRoutes = require('./src/route/orderRoutes');
const userRoutes = require('./src/route/userRoutes');
const paymentRoutes = require('./src/route/paymentRoutes');
const adminRoutes = require('./src/route/adminRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Forever E-Commerce API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// UPDATED Health check route - Add more detailed response and ensure no rate limiting
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected' // You can add actual DB health check here
  });
});

// Handle undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Cleanup orders utility
require('./src/utils/cleanupOrders');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;