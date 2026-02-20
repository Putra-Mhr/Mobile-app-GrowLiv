import { Router } from "express";
import { protectRoute, adminOnly } from "../middleware/auth.middleware.js";
import { createSnapTransaction } from "../controllers/payment.controller.js";
import { handleMidtransNotification } from "../controllers/midtrans-webhook.controller.js";
import { manualVerifyPayment } from "../controllers/manual-verify.controller.js";
import { checkPaymentStatus } from "../controllers/payment-status.controller.js";

const router = Router();

// Midtrans payment route (protected - user creates payment)
router.post("/create-snap-transaction", protectRoute, createSnapTransaction);

// Midtrans webhook (NO authentication - called by Midtrans server, has signature check)
router.post("/notification", handleMidtransNotification);

// Auto-check payment status from Midtrans (called by mobile app after payment)
// This is the PRIMARY auto-verification mechanism
router.get("/check-status/:orderId", protectRoute, checkPaymentStatus);

// Admin-only manual verification fallback
// Only for cases when webhook + auto-check both fail
router.post("/manual-verify/:orderId", protectRoute, adminOnly, manualVerifyPayment);

export default router;
