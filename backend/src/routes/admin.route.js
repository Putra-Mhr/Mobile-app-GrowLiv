import { Router } from "express";
import {
  getAllCustomers,
  getDashboardStats,
  getAdminDashboardExtended,
} from "../controllers/admin.controller.js";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/admin-product.controller.js";
import {
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/admin-order.controller.js";
import {
  getAllStores,
  verifyStore,
  syncStoreCounters,
} from "../controllers/admin-store.controller.js";
import {
  getTreasury,
  getPendingPayouts,
  processPayout,
  getPendingPayoutRecords,
  getPayoutHistory,
} from "../controllers/admin-finance.controller.js";
import { adminOnly, protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(protectRoute, adminOnly);

// ── Products ──────────────────────────────────────────────
router.post("/products", upload.array("images", 3), createProduct);
router.get("/products", getAllProducts);
router.put("/products/:id", upload.array("images", 3), updateProduct);
router.delete("/products/:id", deleteProduct);

// ── Orders ────────────────────────────────────────────────
router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);
router.delete("/orders/:orderId", deleteOrder);

// ── Customers ─────────────────────────────────────────────
router.get("/customers", getAllCustomers);

// ── Dashboard ─────────────────────────────────────────────
router.get("/stats", getDashboardStats);
router.get("/stats/extended", getAdminDashboardExtended);

// ── Store management ──────────────────────────────────────
router.get("/stores", getAllStores);
router.patch("/stores/:storeId/verify", verifyStore);
router.post("/stores/sync-counters", syncStoreCounters);

// ── Treasury & Payouts ────────────────────────────────────
router.get("/treasury", getTreasury);
router.get("/payouts", getPendingPayouts);
router.get("/payouts/pending", getPendingPayoutRecords);
router.get("/payouts/history", getPayoutHistory);
router.post("/payouts/:storeId", processPayout);

export default router;
