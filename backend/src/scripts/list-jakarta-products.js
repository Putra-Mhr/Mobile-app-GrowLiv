/**
 * ONE-TIME SCRIPT: Update existing products that still have Jakarta location
 * This allows admin to properly set location for each product
 */
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { connectDB } from "../config/db.js";

async function updateProductsWithDefaultLocation() {
    try {
        await connectDB();

        console.log("Checking products with Jakarta location...");

        // Find all products with Jakarta location
        const jakartaProducts = await Product.find({
            "location.latitude": -6.2088,
            "location.longitude": 106.8456,
        });

        console.log(`Found ${jakartaProducts.length} products with Jakarta location`);
        console.log("\n⚠️  IMPORTANT: These products need location update from admin panel:");

        jakartaProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
        });

        console.log("\n📍 Next Steps:");
        console.log("1. Go to Admin Panel → Products");
        console.log("2. Edit each product above");
        console.log("3. Click '📍 Pilih Lokasi di Peta'");
        console.log("4. Select correct product location");
        console.log("5. Save product");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

updateProductsWithDefaultLocation();
