import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import { Treasury } from "../models/treasury.model.js";
import { Payout } from "../models/payout.model.js";
import { createNotificationForUser } from "./notification.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const getAllOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = {};
    if (status) filter.status = status;

    const [orders, totalOrders] = await Promise.all([
        Order.find(filter)
            .populate("user", "name email")
            .populate("orderItems.product")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Order.countDocuments(filter),
    ]);

    res.status(200).json({
        orders,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
    });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "shipped", "delivered", "canceled"].includes(status)) {
        throw new AppError("Invalid status", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError("Order not found", 404);
    }

    order.status = status;

    if (status === "shipped" && !order.shippedAt) {
        order.shippedAt = new Date();
    }

    if (status === "delivered" && !order.deliveredAt) {
        order.deliveredAt = new Date();
    }

    // Handle cancellation refund (only if order was paid)
    if (status === "canceled" && order.isPaid) {
        // 1. Restore product stock
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
                console.log(`📦 Stock restored: ${product.name} +${item.quantity}`);
            }
        }

        // 2. Reverse treasury entries — inner try-catch because treasury reversal
        // failure should not block order cancellation
        try {
            const sellerAmount = order.sellerEarnings ||
                order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shippingCost = order.shippingCost || 0;
            const adminFee = order.adminFee || 0;

            const treasury = await Treasury.findOne();
            if (treasury) {
                treasury.adminFeeBalance -= adminFee;
                treasury.shippingBalance -= shippingCost;
                treasury.sellerPendingBalance -= sellerAmount;
                treasury.totalOrdersProcessed -= 1;
                await treasury.save();
                console.log(`💰 Treasury reversed for canceled order: ${order._id}`);
            }
        } catch (treasuryError) {
            console.error("⚠️ Failed to reverse treasury:", treasuryError.message);
        }

        // 3. Cancel payout records — same rationale for inner try-catch
        try {
            await Payout.updateMany(
                { order: order._id, status: "pending" },
                { $set: { status: "cancelled", notes: "Order cancelled by admin" } }
            );
            console.log(`📝 Payout records cancelled for order: ${order._id}`);
        } catch (payoutError) {
            console.error("⚠️ Failed to cancel payouts:", payoutError.message);
        }
    }

    // Build tracking history entry
    let title = "Status Diperbarui";
    let description = `Status pesanan diubah menjadi ${status}`;

    if (status === "shipped") {
        title = "Pesanan Dikirim";
        description = "Pesanan Anda sedang dalam pengiriman ke alamat tujuan";
    } else if (status === "delivered") {
        title = "Pesanan Tiba";
        description = "Pesanan telah diterima di alamat tujuan. Terima kasih telah berbelanja!";
    } else if (status === "canceled") {
        title = "Pesanan Dibatalkan";
        description = "Pesanan dibatalkan oleh admin. Stok telah dikembalikan.";
    }

    order.trackingHistory.push({
        status,
        title,
        description,
        timestamp: new Date(),
    });

    await order.save();

    // Notify seller when order is delivered — inner try-catch so it won't fail the response
    if (status === "delivered" && order.store) {
        try {
            const store = await Store.findById(order.store);
            if (store && store.user) {
                await createNotificationForUser(
                    store.user,
                    "order_status",
                    "Pesanan Diterima ✅",
                    `Pesanan #${order._id.toString().slice(-8).toUpperCase()} telah diterima oleh pembeli.`,
                    { orderId: order._id, type: "order_delivered" }
                );
            }
        } catch (notifError) {
            console.error("⚠️ Failed to notify seller about delivery:", notifError.message);
        }
    }

    res.status(200).json({ message: "Order status updated successfully", order });
});

export const deleteOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError("Order not found", 404);
    }

    await Order.findByIdAndDelete(orderId);
    res.status(200).json({ message: "Order deleted successfully" });
});
