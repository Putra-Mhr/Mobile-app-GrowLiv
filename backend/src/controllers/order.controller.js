import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const createOrder = asyncHandler(async (req, res) => {
  const user = req.user;
  const { orderItems, shippingAddress, paymentResult, totalPrice } = req.body;

  if (!orderItems || orderItems.length === 0) {
    throw new AppError("No order items", 400);
  }

  // validate products and stock
  for (const item of orderItems) {
    const product = await Product.findById(item.product._id);
    if (!product) {
      throw new AppError(`Product ${item.name} not found`, 404);
    }
    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 400);
    }
  }

  const order = await Order.create({
    user: user._id,
    clerkId: user.clerkId,
    orderItems,
    shippingAddress,
    paymentResult,
    totalPrice,
  });

  // NOTE: Stock is NOT reduced here.
  // Stock reduction happens in processSuccessfulPayment when payment is confirmed.
  // This prevents double stock reduction.

  res.status(201).json({ message: "Order created successfully", order });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  // Filter out orders that are just initialized but not paid (awaiting_payment)
  const orders = await Order.find({
    clerkId: req.user.clerkId,
    status: { $ne: 'awaiting_payment' }
  })
    .populate("orderItems.product")
    .sort({ createdAt: -1 });

  // check if each order has been reviewed
  const orderIds = orders.map((order) => order._id);
  const reviews = await Review.find({ orderId: { $in: orderIds } });
  const reviewedOrderIds = new Set(reviews.map((review) => review.orderId.toString()));

  const ordersWithReviewStatus = orders.map((order) => ({
    ...order.toObject(),
    hasReviewed: reviewedOrderIds.has(order._id.toString()),
  }));

  res.status(200).json({ orders: ordersWithReviewStatus });
});
