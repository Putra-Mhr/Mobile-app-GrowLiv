import cloudinary from "../config/cloudinary.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Store } from "../models/store.model.js";
import { Payout } from "../models/payout.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Get seller dashboard stats
 * GET /api/seller/dashboard
 */
export const getSellerDashboard = asyncHandler(async (req, res) => {
    const storeId = req.store._id;

    const [totalProducts, pendingOrders, completedOrders, completedPayouts, pendingPayouts] = await Promise.all([
        Product.countDocuments({ store: storeId }),
        Order.countDocuments({ store: storeId, status: "pending" }),
        Order.countDocuments({ store: storeId, status: "delivered" }),
        Payout.aggregate([
            { $match: { store: storeId, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        Payout.aggregate([
            { $match: { store: storeId, status: "pending" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
    ]);

    res.json({
        totalProducts,
        pendingOrders,
        completedOrders,
        totalRevenue: completedPayouts[0]?.total || 0,
        pendingRevenue: pendingPayouts[0]?.total || 0,
        store: req.store,
    });
});

/**
 * Get seller's products
 * GET /api/seller/products
 */
export const getSellerProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ store: req.store._id })
        .sort({ createdAt: -1 });

    res.json(products);
});

/**
 * Get a single seller product by ID
 * GET /api/seller/products/:id
 */
export const getSellerProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, store: req.store._id });

    if (!product) {
        throw new AppError("Produk tidak ditemukan", 404);
    }

    res.json(product);
});

/**
 * Create a new product (auto-fill location from store)
 * POST /api/seller/products
 */
export const createSellerProduct = asyncHandler(async (req, res) => {
    const { name, description, price, stock, category, images } = req.body;

    if (!name || !description || price === undefined || !category) {
        throw new AppError("Nama, deskripsi, harga, dan kategori wajib diisi", 400);
    }

    // Upload images to Cloudinary
    const uploadedImages = [];
    if (images && images.length > 0) {
        for (const imageBase64 of images) {
            try {
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: "groliv/products",
                });
                uploadedImages.push(uploadResult.secure_url);
            } catch (uploadError) {
                console.error("Error uploading product image:", uploadError);
            }
        }
    }

    if (uploadedImages.length === 0) {
        throw new AppError("Minimal satu gambar produk diperlukan", 400);
    }

    // Auto-fill location from store's pickup address
    const product = await Product.create({
        store: req.store._id,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock) || 0,
        category,
        images: uploadedImages,
        location: {
            latitude: req.store.pickupAddress.coordinates.latitude,
            longitude: req.store.pickupAddress.coordinates.longitude,
            address: `${req.store.pickupAddress.street}, ${req.store.pickupAddress.city}`,
        },
    });

    // Update store product count
    await Store.findByIdAndUpdate(req.store._id, { $inc: { totalProducts: 1 } });

    res.status(201).json({
        message: "Produk berhasil ditambahkan",
        product,
    });
});

/**
 * Update a product
 * PUT /api/seller/products/:id
 */
export const updateSellerProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, store: req.store._id });

    if (!product) {
        throw new AppError("Produk tidak ditemukan", 404);
    }

    const { name, description, price, stock, category, images, newImages } = req.body;

    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (category) product.category = category;

    // Handle image updates
    if (images) {
        product.images = images;
    }

    // Upload new images
    if (newImages && newImages.length > 0) {
        for (const imageBase64 of newImages) {
            try {
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: "groliv/products",
                });
                product.images.push(uploadResult.secure_url);
            } catch (uploadError) {
                console.error("Error uploading product image:", uploadError);
            }
        }
    }

    await product.save();

    res.json({
        message: "Produk berhasil diperbarui",
        product,
    });
});

/**
 * Delete a product
 * DELETE /api/seller/products/:id
 */
export const deleteSellerProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, store: req.store._id });

    if (!product) {
        throw new AppError("Produk tidak ditemukan", 404);
    }

    // Cleanup Cloudinary images before deleting
    if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map((imageUrl) => {
            const publicId = "products/" + imageUrl.split("/products/")[1]?.split(".")[0];
            if (publicId) return cloudinary.uploader.destroy(publicId);
        });
        await Promise.all(deletePromises.filter(Boolean));
    }

    await Product.findByIdAndDelete(id);

    // Update store product count
    await Store.findByIdAndUpdate(req.store._id, { $inc: { totalProducts: -1 } });

    res.json({ message: "Produk berhasil dihapus" });
});

/**
 * Get orders for seller's store
 * GET /api/seller/orders
 */
export const getSellerOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ store: req.store._id })
        .populate("user", "name email imageUrl")
        .sort({ createdAt: -1 });

    res.json(orders);
});

/**
 * Get single order detail for seller
 * GET /api/seller/orders/:id
 */
export const getSellerOrderDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, store: req.store._id })
        .populate("user", "name email imageUrl")
        .populate("orderItems.product", "name images price");

    if (!order) {
        throw new AppError("Pesanan tidak ditemukan", 404);
    }

    res.json({
        order,
        trackingHistory: order.trackingHistory || [],
    });
});

/**
 * Update order status (seller can process and ship)
 * PUT /api/seller/orders/:id/status
 */
export const updateSellerOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, trackingNumber, description } = req.body;

    const order = await Order.findOne({ _id: id, store: req.store._id });

    if (!order) {
        throw new AppError("Pesanan tidak ditemukan", 404);
    }

    // Sellers can only set certain statuses
    const allowedStatuses = ["pending", "shipped"];
    if (!allowedStatuses.includes(status)) {
        throw new AppError("Status tidak valid. Penjual hanya dapat mengubah ke: pending, shipped", 400);
    }

    order.status = status;

    // Add tracking history
    const trackingEntry = {
        status,
        title: status === "shipped" ? "Pesanan Dikirim" : "Pesanan Diproses",
        description: description || (status === "shipped"
            ? `Nomor resi: ${trackingNumber || "-"}`
            : "Penjual sedang memproses pesanan Anda"),
        timestamp: new Date(),
    };
    order.trackingHistory.push(trackingEntry);

    if (status === "shipped") {
        order.shippedAt = new Date();
    }

    await order.save();

    res.json({
        message: "Status pesanan berhasil diperbarui",
        order,
    });
});
