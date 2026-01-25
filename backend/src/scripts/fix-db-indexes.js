import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URL || "mongodb://localhost:27017/groliv";

async function fixIndexes() {
    try {
        console.log("Are you sure you want to fix indexes? This will drop 'productId_1_userId_1_orderId_1' index from reviews.");
        console.log("Connecting to:", MONGODB_URI);

        await mongoose.connect(MONGODB_URI);
        console.log("Connected to database");

        const collection = mongoose.connection.collection("reviews");

        // List indexes
        const indexes = await collection.indexes();
        console.log("Current Indexes:", indexes.map(i => i.name));

        // Drop OLD index (reverting from previous step)
        const oldIndexName = "productId_1_userId_1_orderId_1";
        const indexExists = indexes.some(i => i.name === oldIndexName);

        if (indexExists) {
            console.log(`Dropping index: ${oldIndexName}...`);
            await collection.dropIndex(oldIndexName);
            console.log("✅ Index dropped successfully.");
        } else {
            // Also check for the VERY old one which is the one we ACTUALLY want to keep now, but just checking
            const standardIndex = "productId_1_userId_1";
            if (indexes.some(i => i.name === standardIndex)) {
                console.log("ℹ️ Standard index (productId_1_userId_1) already exists. Good.");
            } else {
                console.log("ℹ️ No conflicting index found, but standard index missing. Mongoose should recreate it on restart.");
            }
        }

        console.log("Done. Please restart your backend server to ensure new indexes are built.");

    } catch (error) {
        console.error("❌ Error fixing indexes:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected");
        process.exit(0);
    }
}

fixIndexes();
