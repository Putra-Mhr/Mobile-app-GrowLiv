import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createSnapTransaction } from "../controllers/payment.controller.js";

const router = Router();

// Midtrans payment route
router.post("/create-snap-transaction", protectRoute, createSnapTransaction);

export default router;
