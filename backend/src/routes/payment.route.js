import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createSnapTransaction } from "../controllers/payment.controller.js";
import { handleMidtransNotification } from "../controllers/midtrans-webhook.controller.js";
import { manualVerifyPayment } from "../controllers/manual-verify.controller.js";
import { checkPaymentStatus } from "../controllers/payment-status.controller.js";

const router = Router();

// Midtrans payment route (protected)
router.post("/create-snap-transaction", protectRoute, createSnapTransaction);

// Midtrans webhook (NO authentication - called by Midtrans server)
router.post("/notification", handleMidtransNotification);

// Check payment status from Midtrans (for when webhook doesn't work)
// Can be called after user completes payment to verify and process
router.get("/check-status/:orderId", protectRoute, checkPaymentStatus);

// TEMPORARY: Manual verification for testing (REMOVE IN PRODUCTION)
router.post("/manual-verify/:orderId", protectRoute, manualVerifyPayment);

export default router;
