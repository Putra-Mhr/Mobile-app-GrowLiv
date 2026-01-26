import { Router } from "express";
import {
  createProduct,
  getAllCustomers,
  getAllOrders,
  getAllProducts,
  getDashboardStats,
  updateOrderStatus,
  updateProduct,
  deleteProduct,
  deleteOrder,
  getAllStores,
  verifyStore,
  getPendingPayouts,
  processPayout,
  getAdminDashboardExtended,
} from "../controllers/admin.controller.js";
import { adminOnly, protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// optimization - DRY
router.use(protectRoute, adminOnly);

router.post("/products", upload.array("images", 3), createProduct);
router.get("/products", getAllProducts);
router.put("/products/:id", upload.array("images", 3), updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);
router.delete("/orders/:orderId", deleteOrder);

router.get("/customers", getAllCustomers);

router.get("/stats", getDashboardStats);
router.get("/stats/extended", getAdminDashboardExtended);

// Store management
router.get("/stores", getAllStores);
router.patch("/stores/:storeId/verify", verifyStore);

// Payout management
router.get("/payouts", getPendingPayouts);
router.post("/payouts/:storeId", processPayout);

// PUT: Used for full resource replacement, updating the entire resource
// PATCH: Used for partial resource updates, updating a specific part of the resource

export default router;

