import { Product } from "../models/product.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Search products with text search, filters, and pagination
 * GET /api/products/search?q=tomat&category=Vegetable&minPrice=5000&maxPrice=50000&page=1&limit=20
 */
export const searchProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const filter = {};

  // Text search using MongoDB text index
  if (q && q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  // Optional filters
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Sort by relevance if searching, otherwise by newest
  const sortOption = q && q.trim()
    ? { score: { $meta: "textScore" }, createdAt: -1 }
    : { createdAt: -1 };

  // Add text score projection only when doing text search
  const projection = q && q.trim() ? { score: { $meta: "textScore" } } : {};

  const [products, total] = await Promise.all([
    Product.find(filter, projection)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('store', 'name imageUrl isVerified'),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id)
    .populate('store', 'name imageUrl _id isVerified pickupAddress');

  if (!product) throw new AppError("Product not found", 404);

  res.status(200).json(product);
});

/**
 * Get products by store ID
 * GET /api/products/by-store/:storeId
 */
export const getProductsByStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  const products = await Product.find({ store: storeId })
    .sort({ createdAt: -1 })
    .populate('store', 'name imageUrl isVerified');

  res.status(200).json({ products });
});
