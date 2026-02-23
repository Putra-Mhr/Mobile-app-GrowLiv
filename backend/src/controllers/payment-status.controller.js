import { Order } from "../models/order.model.js";
import { coreApi } from "../config/midtrans.js";
import { processSuccessfulPayment } from "../services/payment-processing.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Check payment status from Midtrans
 * Automatically verifies and processes payment if settled.
 * GET /api/payment/check-status/:orderId
 */
export const checkPaymentStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    console.log("🔍 Checking payment status for:", orderId);

    // Find order(s) by payment result ID or order ID
    let orders = await Order.find({ "paymentResult.id": orderId });

    if (!orders || orders.length === 0) {
        const order = await Order.findById(orderId);
        if (order) {
            orders = [order];
        }
    }

    if (!orders || orders.length === 0) {
        throw new AppError("Order not found", 404);
    }

    const paymentId = orders[0].paymentResult?.id;
    if (!paymentId) {
        throw new AppError("Order has no payment ID", 400);
    }

    console.log("📋 Checking Midtrans status for payment:", paymentId);

    // Query Midtrans for actual payment status
    // Inner try-catch: Midtrans API failure should return DB status, not crash
    let midtransStatus;
    try {
        midtransStatus = await coreApi.transaction.status(paymentId);
        console.log("📥 Midtrans status response:", midtransStatus);
    } catch (midtransError) {
        console.error("⚠️ Midtrans API error:", midtransError.message);
        return res.status(200).json({
            paymentId,
            orders: orders.map(o => ({
                _id: o._id,
                isPaid: o.isPaid,
                status: o.status
            })),
            midtransError: midtransError.message,
            message: "Could not verify with Midtrans - status from local database"
        });
    }

    const transactionStatus = midtransStatus.transaction_status;
    const fraudStatus = midtransStatus.fraud_status;

    console.log("📊 Transaction status:", transactionStatus, "Fraud:", fraudStatus);

    // Check if payment is successful
    const isSettled =
        transactionStatus === "settlement" ||
        (transactionStatus === "capture" && fraudStatus === "accept");

    if (isSettled) {
        for (const order of orders) {
            if (!order.isPaid) {
                await processSuccessfulPayment(order, { source: "auto" });
            } else {
                console.log("⏭️ Order already paid:", order._id);
            }
        }
    }

    res.status(200).json({
        paymentId,
        midtransStatus: {
            transaction_status: transactionStatus,
            fraud_status: fraudStatus,
            gross_amount: midtransStatus.gross_amount,
            payment_type: midtransStatus.payment_type,
        },
        isSettled,
        orders: orders.map(o => ({
            _id: o._id,
            isPaid: o.isPaid,
            status: o.status
        })),
        message: isSettled ? "Payment confirmed and processed!" : `Payment status: ${transactionStatus}`
    });
});
