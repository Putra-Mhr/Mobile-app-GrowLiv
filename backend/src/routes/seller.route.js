import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sellerOnly } from "../middleware/seller.middleware.js";
import {
    getSellerProducts,
    getSellerProductById,
    createSellerProduct,
    updateSellerProduct,
    deleteSellerProduct,
    getSellerOrders,
    getSellerOrderDetail,
    updateSellerOrderStatus,
    getSellerDashboard,
} from "../controllers/seller.controller.js";

const router = express.Router();

// All routes require authentication + seller role
router.use(protectRoute);
router.use(sellerOnly);

// Dashboard
router.get("/dashboard", getSellerDashboard);

// Product management
router.get("/products", getSellerProducts);
router.get("/products/:id", getSellerProductById);
router.post("/products", createSellerProduct);
router.put("/products/:id", updateSellerProduct);
router.delete("/products/:id", deleteSellerProduct);

// Order management
router.get("/orders", getSellerOrders);
router.get("/orders/:id", getSellerOrderDetail);
router.put("/orders/:id/status", updateSellerOrderStatus);

export default router;
