/**
 * Request Logger Middleware
 * Logs: [METHOD] /path → STATUS (duration ms)
 */
export const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const color = status >= 500 ? "🔴" : status >= 400 ? "🟡" : "🟢";
        console.log(`${color} [${req.method}] ${req.originalUrl} → ${status} (${duration}ms)`);
    });

    next();
};
