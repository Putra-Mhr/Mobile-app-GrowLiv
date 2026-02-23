import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { processSuccessfulPayment } from "../services/payment-processing.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Midtrans Notification/Webhook Handler
 * Called by Midtrans when payment status changes.
 * Includes signature verification for security.
 * Uses shared processSuccessfulPayment for auto-verification.
 */
export const handleMidtransNotification = asyncHandler(async (req, res) => {
    const notification = req.body;

    console.log("📥 Midtrans Notification Received:", {
        order_id: notification.order_id,
        transaction_status: notification.transaction_status,
        fraud_status: notification.fraud_status,
    });

    // ========== SIGNATURE VERIFICATION ==========
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
        console.error("❌ Invalid signature - request rejected");
        throw new AppError("Invalid signature", 403);
    }

    // ========== FIND ORDERS ==========
    const orders = await Order.find({ "paymentResult.id": orderId });

    if (!orders || orders.length === 0) {
        console.error("❌ Order(s) not found for:", orderId);
        throw new AppError("Order not found", 404);
    }

    console.log(`✅ Found ${orders.length} order(s) for payment:`, orderId);

    // ========== PROCESS BASED ON STATUS ==========
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    for (const order of orders) {
        if (transactionStatus === "capture" && fraudStatus === "accept") {
            await processSuccessfulPayment(order, { source: "webhook" });
        } else if (transactionStatus === "settlement") {
            await processSuccessfulPayment(order, { source: "webhook" });
        } else if (
            transactionStatus === "cancel" ||
            transactionStatus === "deny" ||
            transactionStatus === "expire"
        ) {
            if (order.status === "awaiting_payment") {
                order.status = "payment_failed";
            }
            order.paymentResult.status = transactionStatus;
            await order.save();
            console.log("❌ Payment failed/cancelled for order:", order._id);
        } else if (transactionStatus === "pending") {
            order.paymentResult.status = "pending";
            await order.save();
            console.log("⏳ Payment still pending for order:", order._id);
        }
    }

    res.status(200).json({ message: "Notification processed" });
});
