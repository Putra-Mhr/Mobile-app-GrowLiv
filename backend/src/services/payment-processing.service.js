import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { Treasury } from "../models/treasury.model.js";
import { Payout } from "../models/payout.model.js";
import { Store } from "../models/store.model.js";
import { createNotificationForUser } from "../controllers/notification.controller.js";

/**
 * Shared Payment Processing Service
 * Single source of truth for all payment success handling.
 * Used by: webhook, check-status, and manual-verify controllers.
 *
 * Handles:
 * 1. Update order status → paid
 * 2. Reduce product stock
 * 3. Credit platform treasury
 * 4. Create payout record for seller
 * 5. Clear user cart
 *
 * Supports MongoDB transactions with automatic fallback for standalone instances.
 */
export async function processSuccessfulPayment(order, options = {}) {
    const { source = "auto" } = options; // "auto", "webhook", "manual"

    // Skip if already paid (idempotent)
    if (order.isPaid) {
        console.log("⏭️ Order already paid, skipping:", order._id);
        return { alreadyPaid: true };
    }

    let session = null;
    let useTransaction = true;

    // Try to start a MongoDB transaction
    try {
        session = await mongoose.startSession();
        session.startTransaction();
        console.log("💰 Processing payment for order:", order._id, `[${source}]`);
        console.log("   🔒 Transaction started");
    } catch (sessionError) {
        console.log("⚠️ Transactions not supported, running without transaction...");
        console.log("💰 Processing payment for order:", order._id, `[${source}]`);
        useTransaction = false;
        session = null;
    }

    try {
        // ========== 1. UPDATE ORDER STATUS ==========
        order.status = "pending"; // pending shipment
        order.paymentResult.status = "settlement";
        order.paymentResult.updateTime = new Date();
        order.isPaid = true;
        order.paidAt = new Date();

        // Add tracking history
        const trackingTitle = source === "manual"
            ? "Pembayaran Diverifikasi Manual"
            : "Pembayaran Berhasil";
        const trackingDesc = source === "manual"
            ? "Pembayaran telah diverifikasi oleh admin"
            : "Pembayaran telah dikonfirmasi, pesanan akan segera diproses";

        order.trackingHistory.push({
            status: "pending",
            title: trackingTitle,
            description: trackingDesc,
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
                console.log(`📦 Stock reduced: ${product.name} -${item.quantity}`);
            }
        }

        // ========== 3. CREDIT PLATFORM TREASURY ==========
        const sellerAmount = order.sellerEarnings ||
            order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = order.shippingCost || 0;
        const adminFee = order.adminFee || 0;

        console.log("📊 Payment Breakdown:", {
            sellerAmount, shippingCost, adminFee,
            total: sellerAmount + shippingCost + adminFee
        });

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

        console.log(`💰 Treasury updated: Admin +Rp ${adminFee.toLocaleString('id-ID')}, Shipping +Rp ${shippingCost.toLocaleString('id-ID')}, Seller +Rp ${sellerAmount.toLocaleString('id-ID')}`);

        // ========== 4. CREATE PAYOUT RECORD ==========
        if (order.store) {
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
                        shippingCost,
                        adminFee,
                    },
                    notes: `Order #${order._id.toString().slice(-8).toUpperCase()}`,
                };

                if (useTransaction) {
                    await Payout.create([payoutData], { session });
                } else {
                    await Payout.create(payoutData);
                }
                console.log(`📝 Payout created for store ${order.store}: Rp ${sellerAmount.toLocaleString('id-ID')}`);
            }

            // Notify seller about the payment
            try {
                const store = await Store.findById(order.store);
                if (store && store.user) {
                    // Update totalSales counter
                    store.totalSales = (store.totalSales || 0) + 1;
                    await store.save();

                    await createNotificationForUser(
                        store.user,
                        "order_status",
                        "Pesanan Baru Masuk! 🎉",
                        `Pembayaran untuk pesanan #${order._id.toString().slice(-8).toUpperCase()} telah dikonfirmasi. Pendapatan: Rp ${sellerAmount.toLocaleString('id-ID')}`,
                        { orderId: order._id, type: "new_order" }
                    );
                    console.log(`🔔 Seller notified: ${store.name}`);
                }
            } catch (notifError) {
                console.error("⚠️ Failed to notify seller (non-critical):", notifError.message);
            }
        } else {
            console.log("ℹ️ No store (admin product) - no payout record");
        }

        // ========== COMMIT TRANSACTION ==========
        if (useTransaction && session) {
            await session.commitTransaction();
            console.log("✅ Transaction committed for order:", order._id);
        } else {
            console.log("✅ Payment processed for order:", order._id);
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

        return {
            success: true,
            breakdown: { sellerAmount, shippingCost, adminFee },
        };

    } catch (error) {
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
