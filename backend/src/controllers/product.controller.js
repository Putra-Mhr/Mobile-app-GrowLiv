import { Product } from "../models/product.model.js";

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('store', 'name imageUrl _id isVerified pickupAddress');

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get products by store ID
 * GET /api/products/by-store/:storeId
 */
export async function getProductsByStore(req, res) {
  try {
    const { storeId } = req.params;

    const products = await Product.find({ store: storeId })
      .sort({ createdAt: -1 })
      .populate('store', 'name imageUrl isVerified');

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products by store:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


