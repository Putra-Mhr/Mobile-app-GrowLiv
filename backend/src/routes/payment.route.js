import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createSnapTransaction } from "../controllers/payment.controller.js";
import { handleMidtransNotification } from "../controllers/midtrans-webhook.controller.js";
import { manualVerifyPayment } from "../controllers/manual-verify.controller.js";

const router = Router();

// Midtrans payment route (protected)
router.post("/create-snap-transaction", protectRoute, createSnapTransaction);

// Midtrans webhook (NO authentication - called by Midtrans server)
router.post("/notification", handleMidtransNotification);

// TEMPORARY: Manual verification for testing (REMOVE IN PRODUCTION)
router.post("/manual-verify/:orderId", protectRoute, manualVerifyPayment);

export default router;
