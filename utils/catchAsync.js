/**
 * Wraps an async route handler / controller to automatically
 * catch rejected promises and forward them to Express's
 * next() error-handling middleware.
 *
 * Usage:
 *   router.get('/items', catchAsync(async (req, res, next) => { ... }));
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
