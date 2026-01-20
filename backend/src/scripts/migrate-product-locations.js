import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { connectDB } from "../config/db.js";

const DEFAULT_LOCATION = {
    latitude: -6.2088,
    longitude: 106.8456,
    address: "Jakarta, Indonesia",
};

async function migrateProductLocations() {
    try {
        await connectDB();

        console.log("Starting product location migration...");

        const result = await Product.updateMany(
            {
                $or: [{ location: { $exists: false } }, { "location.latitude": { $exists: false } }],
            },
            {
                $set: {
                    location: DEFAULT_LOCATION,
                },
            }
        );

        console.log(`✅ Migration completed!`);
        console.log(`Updated ${result.modifiedCount} products with default location (Jakarta)`);
        console.log(`Matched ${result.matchedCount} products`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrateProductLocations();
