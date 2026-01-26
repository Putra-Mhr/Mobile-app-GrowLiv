import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    registerStore,
    getMyStore,
    updateMyStore,
    getStoreById,
} from "../controllers/store.controller.js";

const router = express.Router();

// Protected routes - require authentication
router.post("/register", protectRoute, registerStore);
router.get("/my-store", protectRoute, getMyStore);
router.put("/my-store", protectRoute, updateMyStore);

// Public route - view any store
router.get("/:storeId", getStoreById);

export default router;
