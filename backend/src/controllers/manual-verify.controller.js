import { Order } from "../models/order.model.js";
import { processSuccessfulPayment } from "../services/payment-processing.service.js";

/**
 * Manual payment verification (ADMIN ONLY fallback)
 * Used when webhook/auto-verification doesn't work.
 * Route must be protected with adminOnly middleware.
 * POST /api/payment/manual-verify/:orderId
 */
export async function manualVerifyPayment(req, res) {
    try {
        const { orderId } = req.params;

        console.log("🔧 Manual payment verification for order:", orderId);

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.isPaid) {
            return res.status(400).json({ message: "Order already paid" });
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
    } catch (error) {
        console.error("❌ Error in manual verification:", error);
        res.status(500).json({ message: "Internal server error", details: error.message });
    }
}
