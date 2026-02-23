/**
 * Custom Application Error
 * Throw this in controllers/services to return structured HTTP errors.
 *
 * Usage:
 *   throw new AppError("Product not found", 404);
 *   throw new AppError("Insufficient stock", 400);
 */
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Distinguishes from programming errors
        Error.captureStackTrace(this, this.constructor);
    }
}
