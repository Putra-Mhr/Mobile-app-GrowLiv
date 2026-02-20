import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Store } from "../models/store.model.js";
import { Treasury } from "../models/treasury.model.js";
import { Payout } from "../models/payout.model.js";
import { createNotificationForUser } from "./notification.controller.js";

export async function createProduct(req, res) {
  try {
    const { name, description, price, stock, category } = req.body;

    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    if (req.files.length > 3) {
      return res.status(400).json({ message: "Maximum 3 images allowed" });
    }

    const uploadPromises = req.files.map((file) => {
      return cloudinary.uploader.upload(file.path, {
        folder: "products",
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    const imageUrls = uploadResults.map((result) => result.secure_url);

    // Parse location data from FormData (comes as nested object)
    const latitude = parseFloat(req.body.location?.latitude);
    const longitude = parseFloat(req.body.location?.longitude);
    const address = req.body.location?.address;

    console.log('📥 Received location data:', { latitude, longitude, address });

    if (!latitude || !longitude || !address) {
      return res.status(400).json({ message: "Product location (latitude, longitude, address) is required" });
    }

    const location = { latitude, longitude, address };

    console.log('Creating product with location:', location);

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      images: imageUrls,
      location,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllProducts(req, res) {
  console.log("getAllProducts called, user:", req.user?.name || "No user");
  try {
    console.log("About to query Product.find()");
    // -1 means in desc order: most recent products first
    const products = await Product.find().sort({ createdAt: -1 });
    console.log("Query successful, found products:", products.length);
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message, error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    // DEBUG: Log ALL received data
    console.log('========== UPDATE PRODUCT DEBUG ==========');
    console.log('All req.body keys:', Object.keys(req.body));
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log('==========================================');

    const { name, description, price, stock, category } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock);
    if (category) product.category = category;

    // handle image updates if new images are uploaded
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ message: "Maximum 3 images allowed" });
      }

      const uploadPromises = req.files.map((file) => {
        return cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      product.images = uploadResults.map((result) => result.secure_url);
    }

    // Handle location updates (location comes as nested object from FormData)
    const newLatitude = req.body.location?.latitude;
    const newLongitude = req.body.location?.longitude;
    const newAddress = req.body.location?.address;

    console.log('🔍 Location update attempt:', {
      newLatitude,
      newLongitude,
      newAddress,
      currentLocation: product.location
    });

    // Update location if any location field is provided
    if (newLatitude && newLongitude && newAddress) {
      const updatedLocation = {
        latitude: parseFloat(newLatitude),
        longitude: parseFloat(newLongitude),
        address: newAddress,
      };

      product.location = updatedLocation;
      console.log('✅ Location updated to:', updatedLocation);
    } else {
      console.log('⚠️ Incomplete location data, keeping existing location');
    }

    await product.save();

    console.log('💾 Product saved with location:', product.location);

    res.status(200).json(product);
  } catch (error) {
    console.error("Error updating products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllOrders(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // optional status filter

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
  } catch (error) {
    console.error("Error in getAllOrders controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "shipped", "delivered", "canceled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
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

      // 2. Reverse treasury entries
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

      // 3. Cancel payout records
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

    // Push tracking history BEFORE save (single atomic save)
    order.trackingHistory.push({
      status,
      title,
      description,
      timestamp: new Date(),
    });

    await order.save();

    // Notify seller when order is delivered
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
  } catch (error) {
    console.error("Error in updateOrderStatus controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllCustomers(_, res) {
  try {
    const customers = await User.find().sort({ createdAt: -1 }); // latest user first
    res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getDashboardStats(_, res) {
  try {
    const totalOrders = await Order.countDocuments();

    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    const totalCustomers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((imageUrl) => {
        // Extract public_id from URL (assumes format: .../products/publicId.ext)
        const publicId = "products/" + imageUrl.split("/products/")[1]?.split(".")[0];
        if (publicId) return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises.filter(Boolean));
    }

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await Order.findByIdAndDelete(orderId);
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};

// ==================== STORE MANAGEMENT ====================

/**
 * Get all stores for admin management
 * GET /api/admin/stores
 */
export const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate('user', 'name email imageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({ stores });
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ message: "Failed to fetch stores" });
  }
};

/**
 * Verify or reject a store
 * PATCH /api/admin/stores/:storeId/verify
 */
export const verifyStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { isVerified, rejectionReason } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    store.isVerified = isVerified;

    // Optionally store rejection reason (would need to add field to schema)
    if (!isVerified && rejectionReason) {
      console.log(`Store ${store.name} rejected: ${rejectionReason}`);
    }

    await store.save();

    res.status(200).json({
      message: isVerified ? "Toko berhasil diverifikasi" : "Toko ditolak",
      store,
    });
  } catch (error) {
    console.error("Error verifying store:", error);
    res.status(500).json({ message: "Failed to verify store" });
  }
};

/**
 * Get all pending payouts (stores with balance > 0)
 * GET /api/admin/payouts
 */
export const getPendingPayouts = async (req, res) => {
  try {
    const stores = await Store.find({ balance: { $gt: 0 } })
      .populate('user', 'name email')
      .sort({ balance: -1 });

    const totalPending = stores.reduce((sum, store) => sum + store.balance, 0);

    res.status(200).json({
      stores,
      totalPending,
    });
  } catch (error) {
    console.error("Error fetching pending payouts:", error);
    res.status(500).json({ message: "Failed to fetch pending payouts" });
  }
};

/**
 * Get Platform Treasury status
 * GET /api/admin/treasury
 */
export const getTreasury = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error fetching treasury:", error);
    res.status(500).json({ message: "Failed to fetch treasury" });
  }
};

/**
 * Get all pending payouts from Payout records
 * GET /api/admin/payouts/pending
 */
export const getPendingPayoutRecords = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error fetching pending payout records:", error);
    res.status(500).json({ message: "Failed to fetch pending payouts" });
  }
};

/**
 * Process payout to a store - with transaction safety
 * Transfers from Platform Treasury to Store Balance
 * POST /api/admin/payouts/:storeId
 */
export const processPayout = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { amount, notes } = req.body;

    const store = await Store.findById(storeId).populate('user', 'name email');
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Get treasury
    const treasury = await Treasury.getInstance();

    // Calculate how much is available for this store from pending payouts
    const pendingPayoutsForStore = await Payout.find({
      store: storeId,
      status: "pending"
    });
    const availableForStore = pendingPayoutsForStore.reduce((sum, p) => sum + p.amount, 0);

    const payoutAmount = amount || availableForStore;

    if (payoutAmount <= 0) {
      return res.status(400).json({ message: "No pending payout available for this store" });
    }

    if (payoutAmount > availableForStore) {
      return res.status(400).json({ message: `Payout amount exceeds available balance (Rp ${availableForStore.toLocaleString('id-ID')})` });
    }

    if (payoutAmount > treasury.sellerPendingBalance) {
      return res.status(400).json({ message: "Insufficient treasury balance" });
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
      // Process payout: Deduct from treasury
      await treasury.processPayout(payoutAmount);

      // Credit to store balance
      store.balance = (store.balance || 0) + payoutAmount;
      store.totalRevenue = (store.totalRevenue || 0) + payoutAmount;

      if (useTransaction) {
        await store.save({ session });
      } else {
        await store.save();
      }

      // Mark pending payouts as completed (up to the payout amount)
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

          // Create completed record for the paid portion
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

      // Commit transaction
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
      throw innerError;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  } catch (error) {
    console.error("Error processing payout:", error);
    res.status(500).json({ message: error.message || "Failed to process payout" });
  }
};

/**
 * Get payout history
 * GET /api/admin/payouts/history
 */
export const getPayoutHistory = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error fetching payout history:", error);
    res.status(500).json({ message: "Failed to fetch payout history" });
  }
};

/**
 * Get admin dashboard stats including store stats
 * Enhanced version with store and treasury information
 */
export const getAdminDashboardExtended = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalStores = await Store.countDocuments();
    const pendingVerification = await Store.countDocuments({ isVerified: false });

    // Get treasury data
    const treasury = await Treasury.getInstance();

    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Count pending payouts from Payout model
    const pendingPayoutsCount = await Payout.countDocuments({ status: "pending" });
    const pendingPayoutsResult = await Payout.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingPayoutsAmount = pendingPayoutsResult[0]?.total || 0;

    res.status(200).json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      totalSellers,
      totalStores,
      pendingVerification,
      pendingPayoutsCount,
      pendingPayoutsAmount,
      treasury: {
        adminFeeBalance: treasury.adminFeeBalance,
        shippingBalance: treasury.shippingBalance,
        sellerPendingBalance: treasury.sellerPendingBalance,
        totalOrdersProcessed: treasury.totalOrdersProcessed,
      },
    });
  } catch (error) {
    console.error("Error fetching extended dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

/**
 * Sync store counters (totalProducts, totalSales) from actual data
 * POST /api/admin/stores/sync-counters
 */
export const syncStoreCounters = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error syncing store counters:", error);
    res.status(500).json({ message: "Failed to sync store counters" });
  }
};
