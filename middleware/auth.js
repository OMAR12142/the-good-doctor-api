const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const Doctor = require('../models/Doctor');

/**
 * Authentication middleware.
 *
 * 1. Extracts the JWT from the `Authorization: Bearer <token>` header.
 * 2. Verifies and decodes the token using the JWT_SECRET.
 * 3. Confirms the doctor still exists in the database.
 * 4. Attaches `req.user = { id: <doctorId> }` for downstream use.
 *
 * All failures throw an AppError caught by the global error handler —
 * the server never crashes on bad tokens.
 */
const protect = async (req, res, next) => {
  try {
    // ─── 1. Extract token from header ────────────────────────────────────
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please provide a valid token.', 401)
      );
    }

    // ─── 2. Verify token ─────────────────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(
          new AppError('Your token has expired. Please log in again.', 401)
        );
      }
      if (err.name === 'JsonWebTokenError') {
        return next(
          new AppError('Invalid token. Please log in again.', 401)
        );
      }
      // Any other JWT error (e.g., NotBeforeError)
      return next(
        new AppError('Token verification failed. Please log in again.', 401)
      );
    }

    // ─── 3. Check if doctor still exists ─────────────────────────────────
    const currentDoctor = await Doctor.findById(decoded.id).select('_id');

    if (!currentDoctor) {
      return next(
        new AppError(
          'The doctor belonging to this token no longer exists.',
          401
        )
      );
    }

    // ─── 4. Attach doctor ID to request — multi-tenancy anchor ──────────
    req.user = { id: currentDoctor._id };

    next();
  } catch (err) {
    // Safety net: forward any unexpected errors to the global handler
    return next(
      new AppError('Authentication failed. Please try again.', 401)
    );
  }
};

module.exports = { protect };
