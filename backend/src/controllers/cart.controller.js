import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ clerkId: req.user.clerkId }).populate("items.product");

  if (!cart) {
    const user = req.user;
    cart = await Cart.create({
      user: user._id,
      clerkId: user.clerkId,
      items: [],
    });
  }

  res.status(200).json({ cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  let cart = await Cart.findOne({ clerkId: req.user.clerkId });

  if (!cart) {
    const user = req.user;
    cart = await Cart.create({
      user: user._id,
      clerkId: user.clerkId,
      items: [],
    });
  }

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  if (existingItem) {
    const newQuantity = existingItem.quantity + 1;
    if (product.stock < newQuantity) {
      throw new AppError("Insufficient stock", 400);
    }
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  res.status(200).json({ message: "Item added to cart", cart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  const cart = await Cart.findOne({ clerkId: req.user.clerkId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (itemIndex === -1) {
    throw new AppError("Item not found in cart", 404);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  res.status(200).json({ message: "Cart updated successfully", cart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ clerkId: req.user.clerkId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();

  res.status(200).json({ message: "Item removed from cart", cart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { clerkId: req.user.clerkId },
    { $set: { items: [] } },
    { new: true }
  );

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  res.status(200).json({ message: "Cart cleared", cart });
});

export const calculateShipping = asyncHandler(async (req, res) => {
  const { coordinates } = req.body;

  if (!coordinates?.latitude || !coordinates?.longitude) {
    throw new AppError("Coordinates required", 400);
  }

  const cart = await Cart.findOne({ clerkId: req.user.clerkId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return res.status(200).json({ total: 0, breakdown: [] });
  }

  const { calculateCartShipping } = await import("../services/shipping.service.js");

  let shipping;
  try {
    shipping = calculateCartShipping(cart.items, coordinates);
  } catch (calcError) {
    throw new AppError(calcError.message, 400);
  }

  res.status(200).json(shipping);
});

/**
 * Validate cart items stock before checkout
 * POST /api/cart/validate
 */
export const validateCartStock = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ clerkId: req.user.clerkId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return res.status(200).json({ valid: true, issues: [] });
  }

  const issues = [];
  const validItems = [];

  for (const item of cart.items) {
    if (!item.product) {
      issues.push({
        productId: item.product,
        type: "not_found",
        message: "Produk tidak tersedia lagi",
      });
      continue;
    }

    if (item.product.stock <= 0) {
      issues.push({
        productId: item.product._id,
        name: item.product.name,
        type: "out_of_stock",
        message: `${item.product.name} sudah habis`,
      });
    } else if (item.product.stock < item.quantity) {
      issues.push({
        productId: item.product._id,
        name: item.product.name,
        type: "insufficient_stock",
        requested: item.quantity,
        available: item.product.stock,
        message: `${item.product.name} hanya tersisa ${item.product.stock} unit`,
      });
    } else {
      validItems.push(item);
    }
  }

  res.status(200).json({
    valid: issues.length === 0,
    issues,
    totalItems: cart.items.length,
    validItems: validItems.length,
  });
});
