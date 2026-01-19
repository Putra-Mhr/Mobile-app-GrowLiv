import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createPaymentIntent, handleWebhook, createSnapTransaction } from "../controllers/payment.controller.js";

const router = Router();

router.post("/create-intent", protectRoute, createPaymentIntent);
router.post("/create-snap-transaction", protectRoute, createSnapTransaction);

// No auth needed - Stripe validates via signature
router.post("/webhook", handleWebhook);

export default router;
