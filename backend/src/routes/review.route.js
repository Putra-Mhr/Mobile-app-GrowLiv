import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    createReview,
    createProductReview,
    getProductReviews,
    deleteReview
} from "../controllers/review.controller.js";

const router = Router();

// Get reviews for a product (public)
router.get("/product/:productId", getProductReviews);

// Create review for a product (from product page - no order required)
router.post("/product", protectRoute, createProductReview);

// Create review for an order item (original - requires delivered order)
router.post("/", protectRoute, createReview);

// Delete a review
router.delete("/:reviewId", protectRoute, deleteReview);

export default router;
