const logger = require('../utils/logger');
 
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
 
  // Log error
  logger.error(`[${status}] ${message}`);
 
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).reduce((acc, curr) => {
      acc[curr.path] = curr.message;
      return acc;
    }, {});
 
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }
 
  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }
 
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }
 
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
 
  // Generic error response
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
 
module.exports = errorHandler;
 