/**
 * Debug script to check Payout records and indexes
 * Run: node src/scripts/debug-payouts.js
 */
import mongoose from "mongoose";
import { config } from "dotenv";
config();

const MONGO_URI = process.env.MONGO_URI;

async function debugPayouts() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected!");

        const db = mongoose.connection.db;

        // 1. Check Payouts collection indexes
        console.log("\n📋 PAYOUT INDEXES:");
        const payoutsCollection = db.collection("payouts");
        const indexes = await payoutsCollection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        // 2. Count Payout records
        console.log("\n📊 PAYOUT COUNTS:");
        const total = await payoutsCollection.countDocuments();
        const pending = await payoutsCollection.countDocuments({ status: "pending" });
        const completed = await payoutsCollection.countDocuments({ status: "completed" });
        console.log(`Total: ${total}, Pending: ${pending}, Completed: ${completed}`);

        // 3. List all pending payouts
        console.log("\n📝 PENDING PAYOUTS:");
        const pendingPayouts = await payoutsCollection.find({ status: "pending" }).toArray();
        for (const p of pendingPayouts) {
            console.log(`  - Store: ${p.store}, Order: ${p.order}, Amount: Rp ${p.amount?.toLocaleString('id-ID')}, Type: ${p.type}`);
        }

        // 4. Check recent orders
        console.log("\n📦 RECENT PAID ORDERS:");
        const ordersCollection = db.collection("orders");
        const recentPaidOrders = await ordersCollection
            .find({ isPaid: true })
            .sort({ paidAt: -1 })
            .limit(5)
            .toArray();

        for (const o of recentPaidOrders) {
            console.log(`  - Order: ${o._id}, Store: ${o.store}, isPaid: ${o.isPaid}, Status: ${o.status}`);
            console.log(`    sellerEarnings: Rp ${o.sellerEarnings?.toLocaleString('id-ID')}, paidAt: ${o.paidAt}`);
        }

        // 5. Check if any paid order is missing payout
        console.log("\n🔍 CHECKING FOR MISSING PAYOUTS:");
        const paidOrdersWithStores = await ordersCollection.find({
            isPaid: true,
            store: { $exists: true, $ne: null }
        }).toArray();

        for (const order of paidOrdersWithStores) {
            const hasPayout = await payoutsCollection.findOne({
                order: order._id,
                type: "order_payment"
            });
            if (!hasPayout) {
                console.log(`  ⚠️ MISSING PAYOUT for order: ${order._id}`);
                console.log(`     Store: ${order.store}, Amount: Rp ${order.sellerEarnings?.toLocaleString('id-ID')}`);
            }
        }

        // 6. Drop old unique index if exists
        console.log("\n🔧 CHECKING FOR OLD INDEX:");
        for (const idx of indexes) {
            // Check if there's an old unique index on just 'order' field
            if (idx.key && idx.key.order === 1 && !idx.key.type && idx.unique) {
                console.log("  ⚠️ Found old unique index on 'order' - this might block new payouts!");
                console.log("  Dropping old index:", idx.name);
                await payoutsCollection.dropIndex(idx.name);
                console.log("  ✅ Dropped old index!");
            }
        }

        console.log("\n✅ Debug complete!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
    }
}

debugPayouts();
