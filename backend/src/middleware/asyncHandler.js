/**
 * Async Handler Utility
 * Wraps async controller functions to automatically catch errors
 * and pass them to the Express error handler middleware.
 *
 * Usage:
 *   export const getCart = asyncHandler(async (req, res) => {
 *     const cart = await Cart.findOne(...);
 *     res.json({ cart });
 *   });
 *
 * No more try-catch boilerplate needed!
 */
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
