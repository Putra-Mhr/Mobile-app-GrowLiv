import mongoose from "mongoose";

/**
 * Platform Treasury - Single document tracking all platform finances
 * There should only be ONE document in this collection
 */
const treasurySchema = new mongoose.Schema(
    {
        // Revenue pools (money held by platform)
        adminFeeBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        shippingBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        sellerPendingBalance: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Lifetime totals (for reporting)
        totalAdminFeeEarned: {
            type: Number,
            default: 0,
        },
        totalShippingCollected: {
            type: Number,
            default: 0,
        },
        totalSellerPayouts: {
            type: Number,
            default: 0,
        },
        totalOrdersProcessed: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Static method to get or create the singleton treasury document
treasurySchema.statics.getInstance = async function () {
    let treasury = await this.findOne();
    if (!treasury) {
        treasury = await this.create({});
        console.log("📦 Created new Treasury instance");
    }
    return treasury;
};

// Method to record incoming payment
treasurySchema.methods.recordPayment = async function (adminFee, shippingCost, sellerAmount) {
    this.adminFeeBalance += adminFee;
    this.shippingBalance += shippingCost;
    this.sellerPendingBalance += sellerAmount;

    this.totalAdminFeeEarned += adminFee;
    this.totalShippingCollected += shippingCost;
    this.totalOrdersProcessed += 1;

    await this.save();
    console.log(`💰 Treasury updated: +${adminFee} admin, +${shippingCost} shipping, +${sellerAmount} seller pending`);
};

// Method to process payout to seller
treasurySchema.methods.processPayout = async function (amount) {
    if (amount > this.sellerPendingBalance) {
        throw new Error("Insufficient seller pending balance");
    }
    this.sellerPendingBalance -= amount;
    this.totalSellerPayouts += amount;
    await this.save();
};

export const Treasury = mongoose.model("Treasury", treasurySchema);
