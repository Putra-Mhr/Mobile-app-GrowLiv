import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";

/**
 * TEMPORARY: Manual payment verification for testing
 * Use this when webhook is not set up yet
 * DELETE THIS IN PRODUCTION - use webhook only
 */
export async function manualVerifyPayment(req, res) {
    try {
        const { orderId } = req.params;

        console.log("🔧 Manual payment verification for order:", orderId);

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        if (order.isPaid) {
            return res.status(400).json({ error: "Order already paid" });
        }

        console.log("✅ Manually marking order as paid...");

        // Update order status
        order.status = "pending"; // pending shipment, payment is done
        order.paymentResult.status = "settlement";
        order.paymentResult.updateTime = new Date();
        order.isPaid = true;
        order.paidAt = new Date();

        // Reduce product stock
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock -= item.quantity;
                if (product.stock < 0) product.stock = 0;
                await product.save();
                console.log(`📦 Reduced stock for ${product.name}: -${item.quantity}`);
            }
        }

        // Clear user cart
        try {
            await Cart.findOneAndUpdate(
                { user: order.user },
                { $set: { items: [] } }
            );
            console.log("🛒 Cart cleared for user:", order.user);
        } catch (cartError) {
            console.error("⚠️ Failed to clear cart during manual verify (ignoring):", cartError);
        }

        // Add tracking history
        order.trackingHistory.push({
            status: "pending",
            title: "Pembayaran Diverifikasi Manual",
            description: "Pembayaran telah diverifikasi oleh admin",
            timestamp: new Date(),
        });

        await order.save();
        console.log("✅ Order marked as paid:", order._id);

        res.status(200).json({
            message: "Order manually verified as paid",
            order
        });
    } catch (error) {
        console.error("Error in manual verification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
