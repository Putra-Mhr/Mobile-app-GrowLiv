import mongoose from "mongoose";
import { Store } from "../models/store.model.js";
import { Treasury } from "../models/treasury.model.js";
import { Payout } from "../models/payout.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Get all pending payouts (stores with balance > 0)
 * GET /api/admin/payouts
 */
export const getPendingPayouts = asyncHandler(async (req, res) => {
    const stores = await Store.find({ balance: { $gt: 0 } })
        .populate('user', 'name email')
        .sort({ balance: -1 });

    const totalPending = stores.reduce((sum, store) => sum + store.balance, 0);

    res.status(200).json({
        stores,
        totalPending,
    });
});

/**
 * Get Platform Treasury status
 * GET /api/admin/treasury
 */
export const getTreasury = asyncHandler(async (req, res) => {
    const treasury = await Treasury.getInstance();

    res.status(200).json({
        treasury: {
            adminFeeBalance: treasury.adminFeeBalance,
            shippingBalance: treasury.shippingBalance,
            sellerPendingBalance: treasury.sellerPendingBalance,
            totalAdminFeeEarned: treasury.totalAdminFeeEarned,
            totalShippingCollected: treasury.totalShippingCollected,
            totalSellerPayouts: treasury.totalSellerPayouts,
            totalOrdersProcessed: treasury.totalOrdersProcessed,
            updatedAt: treasury.updatedAt,
        }
    });
});

/**
 * Get all pending payouts from Payout records
 * GET /api/admin/payouts/pending
 */
export const getPendingPayoutRecords = asyncHandler(async (req, res) => {
    const payouts = await Payout.find({ status: "pending" })
        .populate('store', 'name imageUrl user')
        .populate('order', 'totalPrice createdAt')
        .sort({ createdAt: -1 });

    // Group by store for summary
    const storePayouts = {};
    for (const payout of payouts) {
        const storeId = payout.store?._id?.toString();
        if (!storeId) continue;

        if (!storePayouts[storeId]) {
            storePayouts[storeId] = {
                store: payout.store,
                totalPending: 0,
                payouts: [],
            };
        }
        storePayouts[storeId].totalPending += payout.amount;
        storePayouts[storeId].payouts.push(payout);
    }

    const totalPending = payouts.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
        payouts,
        groupedByStore: Object.values(storePayouts),
        totalPending,
    });
});

/**
 * Process payout to a store - with transaction safety
 * Transfers from Platform Treasury to Store Balance
 * POST /api/admin/payouts/:storeId
 *
 * NOTE: This function keeps inner try-catch for the MongoDB transaction
 * logic (session management, commit/abort) — this is intentional and
 * cannot be replaced by asyncHandler alone.
 */
export const processPayout = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { amount, notes } = req.body;

    const store = await Store.findById(storeId).populate('user', 'name email');
    if (!store) {
        throw new AppError("Store not found", 404);
    }

    const treasury = await Treasury.getInstance();

    const pendingPayoutsForStore = await Payout.find({
        store: storeId,
        status: "pending"
    });
    const availableForStore = pendingPayoutsForStore.reduce((sum, p) => sum + p.amount, 0);

    const payoutAmount = amount || availableForStore;

    if (payoutAmount <= 0) {
        throw new AppError("No pending payout available for this store", 400);
    }

    if (payoutAmount > availableForStore) {
        throw new AppError(`Payout amount exceeds available balance (Rp ${availableForStore.toLocaleString('id-ID')})`, 400);
    }

    if (payoutAmount > treasury.sellerPendingBalance) {
        throw new AppError("Insufficient treasury balance", 400);
    }

    // Try to use transaction for atomicity
    let session = null;
    let useTransaction = true;

    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (sessionError) {
        console.log("⚠️ Transactions not supported, running payout without transaction...");
        useTransaction = false;
        session = null;
    }

    try {
        // Inline treasury update (instead of treasury.processPayout) to use session
        if (payoutAmount > treasury.sellerPendingBalance) {
            throw new AppError("Insufficient seller pending balance in treasury", 400);
        }
        treasury.sellerPendingBalance -= payoutAmount;
        treasury.totalSellerPayouts += payoutAmount;

        if (useTransaction) {
            await treasury.save({ session });
        } else {
            await treasury.save();
        }

        store.balance = (store.balance || 0) + payoutAmount;
        store.totalRevenue = (store.totalRevenue || 0) + payoutAmount;

        if (useTransaction) {
            await store.save({ session });
        } else {
            await store.save();
        }

        // Mark pending payouts as completed
        let remainingAmount = payoutAmount;
        for (const payout of pendingPayoutsForStore) {
            if (remainingAmount <= 0) break;

            if (payout.amount <= remainingAmount) {
                payout.status = "completed";
                payout.processedBy = req.user?._id;
                payout.notes = notes || payout.notes;
                if (useTransaction) {
                    await payout.save({ session });
                } else {
                    await payout.save();
                }
                remainingAmount -= payout.amount;
            } else {
                // Partial payout - split the record
                payout.amount -= remainingAmount;
                if (useTransaction) {
                    await payout.save({ session });
                } else {
                    await payout.save();
                }

                const partialData = {
                    store: storeId,
                    order: payout.order,
                    amount: remainingAmount,
                    type: "manual_payout",
                    status: "completed",
                    processedBy: req.user?._id,
                    notes: notes || `Partial payout from ${payout._id}`,
                };
                if (useTransaction) {
                    await Payout.create([partialData], { session });
                } else {
                    await Payout.create(partialData);
                }
                remainingAmount = 0;
            }
        }

        if (useTransaction && session) {
            await session.commitTransaction();
        }

        console.log(`✅ Payout processed: Rp ${payoutAmount.toLocaleString('id-ID')} to ${store.name}`);

        res.status(200).json({
            message: `Berhasil mencairkan Rp ${payoutAmount.toLocaleString('id-ID')} ke ${store.name}`,
            store: {
                _id: store._id,
                name: store.name,
                balance: store.balance,
                user: store.user,
            },
            payoutAmount,
            treasury: {
                sellerPendingBalance: treasury.sellerPendingBalance,
            },
        });
    } catch (innerError) {
        if (useTransaction && session) {
            await session.abortTransaction();
            console.error("❌ Payout transaction aborted");
        }
        throw innerError; // Re-throw so asyncHandler catches it
    } finally {
        if (session) {
            session.endSession();
        }
    }
});

/**
 * Get payout history
 * GET /api/admin/payouts/history
 */
export const getPayoutHistory = asyncHandler(async (req, res) => {
    const { storeId, status, limit = 50 } = req.query;

    const query = {};
    if (storeId) query.store = storeId;
    if (status) query.status = status;

    const payouts = await Payout.find(query)
        .populate('store', 'name imageUrl')
        .populate('order', 'totalPrice')
        .populate('processedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    res.status(200).json({ payouts });
});
