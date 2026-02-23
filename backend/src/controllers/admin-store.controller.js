import { Store } from "../models/store.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Get all stores for admin management
 * GET /api/admin/stores
 */
export const getAllStores = asyncHandler(async (req, res) => {
    const stores = await Store.find()
        .populate('user', 'name email imageUrl')
        .sort({ createdAt: -1 });

    res.status(200).json({ stores });
});

/**
 * Verify or reject a store
 * PATCH /api/admin/stores/:storeId/verify
 */
export const verifyStore = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { isVerified, rejectionReason } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError("Store not found", 404);
    }

    store.isVerified = isVerified;

    if (!isVerified && rejectionReason) {
        console.log(`Store ${store.name} rejected: ${rejectionReason}`);
    }

    await store.save();

    res.status(200).json({
        message: isVerified ? "Toko berhasil diverifikasi" : "Toko ditolak",
        store,
    });
});

/**
 * Sync store counters (totalProducts, totalSales) from actual data
 * POST /api/admin/stores/sync-counters
 */
export const syncStoreCounters = asyncHandler(async (req, res) => {
    const stores = await Store.find();
    const results = [];

    for (const store of stores) {
        const [actualProducts, actualSales] = await Promise.all([
            Product.countDocuments({ store: store._id }),
            Order.countDocuments({ store: store._id, isPaid: true }),
        ]);

        const changed =
            store.totalProducts !== actualProducts || store.totalSales !== actualSales;

        if (changed) {
            store.totalProducts = actualProducts;
            store.totalSales = actualSales;
            await store.save();
        }

        results.push({
            storeId: store._id,
            name: store.name,
            totalProducts: actualProducts,
            totalSales: actualSales,
            wasFixed: changed,
        });
    }

    const fixed = results.filter((r) => r.wasFixed).length;
    console.log(`🔄 Store counters synced: ${fixed}/${results.length} stores updated`);

    res.status(200).json({
        message: `${fixed} store(s) updated out of ${results.length}`,
        results,
    });
});
