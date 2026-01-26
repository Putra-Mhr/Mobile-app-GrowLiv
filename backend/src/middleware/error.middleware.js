export const errorHandler = (err, req, res, next) => {
    console.error("Unknown Error:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message: message,
        // Only verify stack trace in development
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};
