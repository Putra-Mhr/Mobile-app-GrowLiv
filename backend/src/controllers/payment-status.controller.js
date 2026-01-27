import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { Treasury } from "../models/treasury.model.js";
import { Payout } from "../models/payout.model.js";
import { coreApi } from "../config/midtrans.js";

/**
 * Check payment status from Midtrans
 * Used when webhook doesn't work (local development)
 * GET /api/payment/check-status/:orderId
 */
export async function checkPaymentStatus(req, res) {
    try {
        const { orderId } = req.params;

        console.log("🔍 Checking payment status for:", orderId);

        // Find order(s) by payment result ID or order ID
        let orders = await Order.find({ "paymentResult.id": orderId });

        if (!orders || orders.length === 0) {
            // Try finding by order _id
            const order = await Order.findById(orderId);
            if (order) {
                orders = [order];
            }
        }

        if (!orders || orders.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        const paymentId = orders[0].paymentResult?.id;
        if (!paymentId) {
            return res.status(400).json({ error: "Order has no payment ID" });
        }

        console.log("📋 Checking Midtrans status for payment:", paymentId);

        // Query Midtrans for actual payment status
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

        console.log("📊 Transaction status:", transactionStatus, "Fraud status:", fraudStatus);

        // Check if payment is successful
        const isSettled =
            transactionStatus === "settlement" ||
            (transactionStatus === "capture" && fraudStatus === "accept");

        if (isSettled) {
            // Process each order
            for (const order of orders) {
                if (!order.isPaid) {
                    await processSuccessfulPayment(order);
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
    } catch (error) {
        console.error("Error checking payment status:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

/**
 * Process successful payment
 * Tries to use MongoDB Transaction if available, otherwise runs without transaction
 */
async function processSuccessfulPayment(order) {
    let session = null;
    let useTransaction = true;

    try {
        // Try to start a session for transaction
        session = await mongoose.startSession();
        session.startTransaction();
        console.log("💰 Processing successful payment for order:", order._id);
        console.log("   🔒 Transaction started");
    } catch (sessionError) {
        // Transactions not supported (standalone MongoDB)
        console.log("⚠️ Transactions not supported, running without transaction...");
        console.log("💰 Processing successful payment for order:", order._id);
        useTransaction = false;
        session = null;
    }

    try {
        // ========== 1. UPDATE ORDER STATUS ==========
        order.status = "pending"; // pending shipment, payment is done
        order.paymentResult.status = "settlement";
        order.paymentResult.updateTime = new Date();
        order.isPaid = true;
        order.paidAt = new Date();

        // Add tracking history
        order.trackingHistory.push({
            status: "pending",
            title: "Pembayaran Berhasil",
            description: "Pembayaran telah dikonfirmasi, pesanan akan segera diproses",
            timestamp: new Date(),
        });

        if (useTransaction) {
            await order.save({ session });
        } else {
            await order.save();
        }
        console.log("✅ Order updated:", order._id);

        // ========== 2. REDUCE PRODUCT STOCK ==========
        for (const item of order.orderItems) {
            const product = useTransaction
                ? await Product.findById(item.product).session(session)
                : await Product.findById(item.product);
            if (product) {
                product.stock -= item.quantity;
                if (product.stock < 0) product.stock = 0;
                if (useTransaction) {
                    await product.save({ session });
                } else {
                    await product.save();
                }
                console.log(`📦 Reduced stock for ${product.name}: -${item.quantity}`);
            }
        }

        // ========== 3. CREDIT PLATFORM TREASURY ==========
        const sellerAmount = order.sellerEarnings || order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = order.shippingCost || 0;
        const adminFee = order.adminFee || 0;

        console.log("📊 Payment Breakdown:", {
            sellerAmount,
            shippingCost,
            adminFee,
            total: sellerAmount + shippingCost + adminFee
        });

        // Get treasury and update
        const treasury = useTransaction
            ? await Treasury.findOne().session(session)
            : await Treasury.findOne();
        if (!treasury) {
            throw new Error("Treasury not found - please initialize first");
        }

        treasury.adminFeeBalance += adminFee;
        treasury.shippingBalance += shippingCost;
        treasury.sellerPendingBalance += sellerAmount;
        treasury.totalAdminFeeEarned += adminFee;
        treasury.totalShippingCollected += shippingCost;
        treasury.totalOrdersProcessed += 1;

        if (useTransaction) {
            await treasury.save({ session });
        } else {
            await treasury.save();
        }

        console.log(`💰 Treasury updated: Admin Fee +Rp ${adminFee.toLocaleString('id-ID')}, Shipping +Rp ${shippingCost.toLocaleString('id-ID')}, Seller Pending +Rp ${sellerAmount.toLocaleString('id-ID')}`);

        // ========== 4. CREATE PAYOUT RECORD ==========
        if (order.store) {
            // Check if payout already exists for this order
            const existingPayout = useTransaction
                ? await Payout.findOne({ order: order._id, type: "order_payment" }).session(session)
                : await Payout.findOne({ order: order._id, type: "order_payment" });

            if (existingPayout) {
                console.log(`⏭️ Payout already exists for order ${order._id}, skipping`);
            } else {
                const payoutData = {
                    store: order.store,
                    order: order._id,
                    amount: sellerAmount,
                    type: "order_payment",
                    status: "pending",
                    breakdown: {
                        productTotal: sellerAmount,
                        shippingCost: shippingCost,
                        adminFee: adminFee,
                    },
                    notes: `Order #${order._id.toString().slice(-8).toUpperCase()}`,
                };

                if (useTransaction) {
                    await Payout.create([payoutData], { session });
                } else {
                    await Payout.create(payoutData);
                }
                console.log(`📝 Payout record created for store ${order.store}: Rp ${sellerAmount.toLocaleString('id-ID')}`);
            }
        } else {
            console.log("ℹ️ No store for this order (admin product) - no payout record");
        }

        // ========== COMMIT TRANSACTION ==========
        if (useTransaction && session) {
            await session.commitTransaction();
            console.log("✅ Transaction committed successfully for order:", order._id);
        } else {
            console.log("✅ Payment processed successfully for order:", order._id);
        }

        // ========== 5. CLEAR CART (non-critical, outside transaction) ==========
        try {
            await Cart.findOneAndUpdate(
                { user: order.user },
                { $set: { items: [] } }
            );
            console.log("🛒 Cart cleared for user:", order.user);
        } catch (cartError) {
            console.error("⚠️ Failed to clear cart (non-critical):", cartError.message);
        }

    } catch (error) {
        // Rollback transaction on any error
        if (useTransaction && session) {
            await session.abortTransaction();
            console.error("❌ Transaction aborted for order:", order._id);
        }
        console.error("❌ Error processing payment:", error.message);
        throw error;
    } finally {
        if (session) {
            session.endSession();
        }
    }
}

