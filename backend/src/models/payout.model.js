import mongoose from "mongoose";

/**
 * Payout Transaction - Audit trail for all payouts
 */
const payoutSchema = new mongoose.Schema(
    {
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: false, // Optional - can be manual payout
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        type: {
            type: String,
            enum: ["order_payment", "manual_payout", "refund"],
            default: "order_payment",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        notes: {
            type: String,
            default: "",
        },
        // For tracking what this payout was for
        breakdown: {
            productTotal: { type: Number, default: 0 },
            shippingCost: { type: Number, default: 0 },
            adminFee: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Index for efficient queries
payoutSchema.index({ store: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });
// Compound unique index: prevents duplicate order_payment for same order,
// but allows manual_payout records for the same order (partial payouts)
payoutSchema.index({ order: 1, type: 1 }, { unique: true, sparse: true });

export const Payout = mongoose.model("Payout", payoutSchema);
