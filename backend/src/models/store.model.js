import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One user can only have one store
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            maxlength: 1000,
        },
        imageUrl: {
            type: String,
            default: "", // Store logo
        },
        pickupAddress: {
            street: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            coordinates: {
                latitude: {
                    type: Number,
                    required: true,
                },
                longitude: {
                    type: Number,
                    required: true,
                },
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false, // Admin must verify before products show in search
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        totalProducts: {
            type: Number,
            default: 0,
        },
        totalSales: {
            type: Number,
            default: 0,
        },
        // Revenue tracking for admin disbursement
        balance: {
            type: Number,
            default: 0, // Pending balance to be paid out
        },
        totalRevenue: {
            type: Number,
            default: 0, // Total earned lifetime
        },
    },
    { timestamps: true }
);

// Index for efficient queries
storeSchema.index({ user: 1 });
storeSchema.index({ isActive: 1, isVerified: 1 });

export const Store = mongoose.model("Store", storeSchema);
