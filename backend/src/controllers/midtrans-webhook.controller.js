import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";

/**
 * Midtrans Notification/Webhook Handler
 * Called by Midtrans when payment status changes
 */
export async function handleMidtransNotification(req, res) {
    try {
        const notification = req.body;

        console.log("📥 Midtrans Notification Received:", {
            order_id: notification.order_id,
            transaction_status: notification.transaction_status,
            fraud_status: notification.fraud_status,
        });

        // Verify signature
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const signatureKey = notification.signature_key;
        const orderId = notification.order_id;
        const statusCode = notification.status_code;
        const grossAmount = notification.gross_amount;

        const mySignature = crypto
            .createHash("sha512")
            .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
            .digest("hex");

        if (signatureKey !== mySignature) {
            console.error("❌ Invalid signature");
            return res.status(403).json({ error: "Invalid signature" });
        }

        // Find order by payment result id
        const order = await Order.findOne({ "paymentResult.id": orderId });

        if (!order) {
            console.error("❌ Order not found for:", orderId);
            return res.status(404).json({ error: "Order not found" });
        }

        console.log("✅ Order found:", order._id);

        // Update order based on transaction status
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        if (transactionStatus === "capture") {
            if (fraudStatus === "accept") {
                // Payment successful
                await handleSuccessfulPayment(order, notification);
            }
        } else if (transactionStatus === "settlement") {
            // Payment successful
            await handleSuccessfulPayment(order, notification);
        } else if (
            transactionStatus === "cancel" ||
            transactionStatus === "deny" ||
            transactionStatus === "expire"
        ) {
            // Payment failed/cancelled
            // Only update status to canceled if it was already visible (not awaiting_payment)
            // If it was awaiting_payment (hidden), we keep it hidden (or could delete it)
            if (order.status !== 'awaiting_payment') {
                order.status = "canceled";
            }
            order.paymentResult.status = transactionStatus;
            await order.save();
            console.log("❌ Payment failed/cancelled for order:", order._id);
        } else if (transactionStatus === "pending") {
            // Keep as pending
            order.paymentResult.status = "pending";
            await order.save();
            console.log("⏳ Payment still pending for order:", order._id);
        }

        res.status(200).json({ message: "Notification processed" });
    } catch (error) {
        console.error("Error handling Midtrans notification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function handleSuccessfulPayment(order, notification) {
    try {
        console.log("💰 Processing successful payment for order:", order._id);

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
        await Cart.findOneAndUpdate(
            { user: order.user },
            { $set: { items: [] } }
        );
        console.log("🛒 Cart cleared for user:", order.user);

        await order.save();
        console.log("✅ Order marked as paid:", order._id);
    } catch (error) {
        console.error("Error in handleSuccessfulPayment:", error);
        throw error;
    }
}
