import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

// Create review for a product (direct review from product page)
export async function createProductReview(req, res) {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const user = req.user;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Create or update review (one review per user per product)
    const review = await Review.findOneAndUpdate(
      { productId, userId: user._id },
      {
        rating,
        comment: comment || "",
        productId,
        userId: user._id
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Populate user info for response
    await review.populate("userId", "name imageUrl");

    // Update product's average rating
    await updateProductRating(productId);

    res.status(201).json({
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error("Error in createProductReview controller:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already reviewed this product" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

// Get all reviews for a product
export async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const reviews = await Review.find({ productId })
      .populate("userId", "name imageUrl")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error in getProductReviews controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Original createReview function for order-based reviews
export async function createReview(req, res) {
  try {
    const { productId, orderId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const user = req.user;

    // verify order exists and is delivered
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clerkId !== user.clerkId) {
      return res.status(403).json({ error: "Not authorized to review this order" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ error: "Can only review delivered orders" });
    }

    // verify product is in the order
    const productInOrder = order.orderItems.find(
      (item) => item.product.toString() === productId.toString()
    );
    if (!productInOrder) {
      return res.status(400).json({ error: "Product not found in this order" });
    }

    // atomic update or create - scoped to PRODUCT (updates existing review if found)
    const review = await Review.findOneAndUpdate(
      { productId, userId: user._id }, // Find by User + Product only
      { rating, comment: comment || "", orderId, productId, userId: user._id },
      { new: true, upsert: true, runValidators: true }
    );

    // Populate user info
    await review.populate("userId", "name imageUrl");

    // Update product rating
    await updateProductRating(productId);

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error in createReview controller:", error);
    // Return detailed error for debugging
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      code: error.code
    });
  }
}

export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    const user = req.user;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this review" });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    // Update product rating after deletion
    await updateProductRating(productId);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error in deleteReview controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Helper function to update product rating
async function updateProductRating(productId) {
  const reviews = await Review.find({ productId });
  const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);

  await Product.findByIdAndUpdate(productId, {
    averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    totalReviews: reviews.length,
  });
}
