import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// Create review for a product (direct review from product page)
export const createProductReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;

  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  const user = req.user;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
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

  await review.populate("userId", "name imageUrl");
  await updateProductRating(productId);

  res.status(201).json({
    message: "Review submitted successfully",
    review
  });
});

// Get all reviews for a product
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  const reviews = await Review.find({ productId })
    .populate("userId", "name imageUrl")
    .sort({ createdAt: -1 });

  res.status(200).json({ reviews });
});

// Original createReview function for order-based reviews
export const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  const user = req.user;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.clerkId !== user.clerkId) {
    throw new AppError("Not authorized to review this order", 403);
  }

  if (order.status !== "delivered") {
    throw new AppError("Can only review delivered orders", 400);
  }

  const productInOrder = order.orderItems.find(
    (item) => item.product.toString() === productId.toString()
  );
  if (!productInOrder) {
    throw new AppError("Product not found in this order", 400);
  }

  // Atomic update or create — scoped to product per user
  const review = await Review.findOneAndUpdate(
    { productId, userId: user._id },
    { rating, comment: comment || "", orderId, productId, userId: user._id },
    { new: true, upsert: true, runValidators: true }
  );

  await review.populate("userId", "name imageUrl");
  await updateProductRating(productId);

  res.status(201).json({ message: "Review submitted successfully", review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const user = req.user;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (review.userId.toString() !== user._id.toString()) {
    throw new AppError("Not authorized to delete this review", 403);
  }

  const productId = review.productId;
  await Review.findByIdAndDelete(reviewId);
  await updateProductRating(productId);

  res.status(200).json({ message: "Review deleted successfully" });
});

// Helper function to update product rating
async function updateProductRating(productId) {
  const reviews = await Review.find({ productId });
  const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);

  await Product.findByIdAndUpdate(productId, {
    averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    totalReviews: reviews.length,
  });
}
