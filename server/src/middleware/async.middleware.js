// Wrapper to handle async/await errors in routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Log the error for debugging
    console.error('Async middleware error:', err);
    next(err);
  });
};

export default asyncHandler;
