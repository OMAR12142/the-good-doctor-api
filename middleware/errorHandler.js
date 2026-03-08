const AppError = require('../utils/AppError');

/**
 * Global error-handling middleware.
 *
 * Catches all errors forwarded via next(err) and sends a
 * structured JSON response. In development mode, the full
 * stack trace is included for debugging convenience.
 */

// ─── Development error response ────────────────────────────────────────────────
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// ─── Production error response ─────────────────────────────────────────────────
const sendErrorProd = (err, res) => {
  // Operational / trusted error — send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown error — don't leak details
  console.error('💥 ERROR:', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.',
  });
};

// ─── Mongoose-specific error handlers ──────────────────────────────────────────
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value "${value}" for field "${field}". Please use another value.`;
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// ─── Global error handler (4-argument signature tells Express this is error MW) ─
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  // Production: transform known Mongoose / driver errors into AppErrors
  let error = { ...err, message: err.message, name: err.name };

  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

  sendErrorProd(error, res);
};

module.exports = globalErrorHandler;
