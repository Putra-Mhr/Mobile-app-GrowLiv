import { Order } from "../models/order.model.js";
import { processSuccessfulPayment } from "../services/payment-processing.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Manual payment verification (ADMIN ONLY fallback)
 * Used when webhook/auto-verification doesn't work.
 * Route must be protected with adminOnly middleware.
 * POST /api/payment/manual-verify/:orderId
 */
export const manualVerifyPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    console.log("🔧 Manual payment verification for order:", orderId);

    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    if (order.isPaid) {
        throw new AppError("Order already paid", 400);
    }

    console.log("📋 Order details:", {
        store: order.store,
        totalPrice: order.totalPrice,
        sellerEarnings: order.sellerEarnings,
        shippingCost: order.shippingCost,
        adminFee: order.adminFee
    });

    // Use shared payment processing (handles everything atomically)
    const result = await processSuccessfulPayment(order, { source: "manual" });

    res.status(200).json({
        message: "Order manually verified as paid",
        treasuryUpdated: true,
        breakdown: result.breakdown,
        order
    });
});
