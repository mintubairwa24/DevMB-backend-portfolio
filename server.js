// server.js
// Main server file - Express setup, MongoDB connection, and middleware configuration

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');

// Routes
const contactRoutes = require('./routes/contactRoutes');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimitMiddleware = require('./middleware/rateLimit');

// Logger
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Add security headers
app.use(helmet());
app.disable('x-powered-by');

// CORS - Allow requests from frontend
// Support comma-separated origins in FRONTEND_URLS, fallback to FRONTEND_URL or localhost
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .map((o) => o.replace(/\/+$/, '').toLowerCase());

const isProd = (process.env.NODE_ENV || 'development') === 'production';

// If running behind a proxy (common in production), trust the first hop
if (isProd || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: (origin, cb) => {
    // allow non-browser requests (like Postman) with no origin
    if (!origin) return cb(null, true);
    // In development, allow any origin to avoid local CORS friction
    if (!isProd) return cb(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '').toLowerCase();
    if (allowedOrigins.length === 0) {
      logger.warn('No FRONTEND_URL(S) configured; allowing all origins in production.');
      return cb(null, true);
    }
    if (allowedOrigins.includes(normalizedOrigin)) return cb(null, true);
    const corsError = new Error(`CORS blocked for origin: ${origin}`);
    corsError.status = 403;
    return cb(corsError);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// BODY PARSER MIDDLEWARE
// ============================================

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

app.use('/api', rateLimitMiddleware);

// ============================================
// LOGGING MIDDLEWARE
// ============================================

// Log all incoming requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Contact routes
app.use('/api/contact', contactRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

app.use(errorHandler);

// ============================================
// DATABASE CONNECTION & SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
