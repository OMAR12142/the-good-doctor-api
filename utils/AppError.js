/**
 * Custom application error class.
 * Extends the native Error to include an HTTP statusCode and
 * an `isOperational` flag to distinguish expected errors from
 * unexpected programming bugs in the global error handler.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace, excluding this constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
