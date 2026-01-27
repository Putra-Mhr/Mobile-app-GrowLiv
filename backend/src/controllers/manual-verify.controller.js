import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { Treasury } from "../models/treasury.model.js";
import { Payout } from "../models/payout.model.js";

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

        console.log("📋 Order details:", {
            store: order.store,
            totalPrice: order.totalPrice,
            sellerEarnings: order.sellerEarnings,
            shippingCost: order.shippingCost,
            adminFee: order.adminFee
        });

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

        // ========== CREDIT PLATFORM TREASURY ==========
        // Calculate breakdown from order
        const sellerAmount = order.sellerEarnings || order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = order.shippingCost || 0;
        const adminFee = order.adminFee || 0;

        console.log("📊 Payment Breakdown:", {
            sellerAmount,
            shippingCost,
            adminFee,
            total: sellerAmount + shippingCost + adminFee
        });

        // Get or create treasury singleton
        const treasury = await Treasury.getInstance();
        console.log("🏦 Treasury before:", {
            adminFeeBalance: treasury.adminFeeBalance,
            shippingBalance: treasury.shippingBalance,
            sellerPendingBalance: treasury.sellerPendingBalance
        });

        // Record payment to treasury
        await treasury.recordPayment(adminFee, shippingCost, sellerAmount);

        console.log("🏦 Treasury after:", {
            adminFeeBalance: treasury.adminFeeBalance,
            shippingBalance: treasury.shippingBalance,
            sellerPendingBalance: treasury.sellerPendingBalance
        });

        console.log(`💰 Treasury updated: Admin Fee +Rp ${adminFee.toLocaleString('id-ID')}, Shipping +Rp ${shippingCost.toLocaleString('id-ID')}, Seller Pending +Rp ${sellerAmount.toLocaleString('id-ID')}`);

        // Create payout record (only for store orders, prevent duplicates)
        if (order.store) {
            try {
                // Check if payout already exists for this order
                const existingPayout = await Payout.findOne({ order: order._id });
                if (existingPayout) {
                    console.log(`⏭️ Payout already exists for order ${order._id}, skipping`);
                } else {
                    await Payout.create({
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
                    });
                    console.log(`📝 Payout record created for store ${order.store}: Rp ${sellerAmount.toLocaleString('id-ID')}`);
                }
            } catch (payoutError) {
                console.error("⚠️ Failed to create payout record:", payoutError.message);
            }
        } else {
            console.log("ℹ️ No store for this order (admin product) - no payout record created, but Treasury still updated");
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
            treasuryUpdated: true,
            breakdown: {
                sellerAmount,
                shippingCost,
                adminFee
            },
            order
        });
    } catch (error) {
        console.error("❌ Error in manual verification:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}
