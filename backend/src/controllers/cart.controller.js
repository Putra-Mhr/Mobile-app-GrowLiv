import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

export async function getCart(req, res) {
  try {
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
  } catch (error) {
    console.error("Error in getCart controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;

    // validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
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

    // check if item already in the cart
    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    if (existingItem) {
      // increment quantity by 1
      const newQuantity = existingItem.quantity + 1;
      if (product.stock < newQuantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      existingItem.quantity = newQuantity;
    } else {
      // add new item
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error in addToCart controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCartItem(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // check if product exists & validate stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error in updateCartItem controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error in removeFromCart controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const clearCart = async (req, res) => {
  try {
    // Use atomic update to avoid VersionError (race conditions)
    const cart = await Cart.findOneAndUpdate(
      { clerkId: req.user.clerkId },
      { $set: { items: [] } },
      { new: true } // Return the updated document
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({ message: "Cart cleared", cart });
  } catch (error) {
    console.error("Error in clearCart controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function calculateShipping(req, res) {
  try {
    const { coordinates } = req.body;

    if (!coordinates?.latitude || !coordinates?.longitude) {
      return res.status(400).json({ message: "Coordinates required" });
    }

    const cart = await Cart.findOne({ clerkId: req.user.clerkId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ total: 0, breakdown: [] });
    }

    // Reuse the existing service which is already used in payment controller
    const { calculateCartShipping } = await import("../services/shipping.service.js");

    let shipping;
    try {
      shipping = calculateCartShipping(cart.items, coordinates);
    } catch (calcError) {
      console.warn("Shipping calc failed (probably missing location data), defaulting to flat rate:", calcError.message);

      return res.status(400).json({ message: calcError.message });
    }

    res.status(200).json(shipping);
  } catch (error) {
    console.error("Error in calculateShipping controller:", error);
    res.status(500).json({ message: "Failed to calculate shipping" });
  }
}

/**
 * Validate cart items stock before checkout
 * POST /api/cart/validate
 */
export async function validateCartStock(req, res) {
  try {
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
  } catch (error) {
    console.error("Error in validateCartStock:", error);
    res.status(500).json({ message: "Failed to validate cart" });
  }
}
