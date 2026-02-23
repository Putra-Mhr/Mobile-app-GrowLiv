import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import { Treasury } from "../models/treasury.model.js";
import { Payout } from "../models/payout.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Admin Dashboard — Core Stats & Customers
 *
 * Product management  → admin-product.controller.js
 * Order management    → admin-order.controller.js
 * Store management    → admin-store.controller.js
 * Finance (Treasury)  → admin-finance.controller.js
 */

export const getAllCustomers = asyncHandler(async (_, res) => {
  const customers = await User.find().sort({ createdAt: -1 });
  res.status(200).json({ customers });
});

export const getDashboardStats = asyncHandler(async (_, res) => {
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
});

export const getAdminDashboardExtended = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalCustomers = await User.countDocuments({ role: 'user' });
  const totalProducts = await Product.countDocuments();
  const totalSellers = await User.countDocuments({ role: 'seller' });
  const totalStores = await Store.countDocuments();
  const pendingVerification = await Store.countDocuments({ isVerified: false });

  const treasury = await Treasury.getInstance();

  const revenueResult = await Order.aggregate([
    { $match: { status: { $in: ['delivered', 'shipped'] } } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

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
});
