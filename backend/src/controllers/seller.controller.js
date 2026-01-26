import cloudinary from "../config/cloudinary.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Store } from "../models/store.model.js";

/**
 * Get seller dashboard stats
 * GET /api/seller/dashboard
 */
export const getSellerDashboard = async (req, res) => {
    try {
        const storeId = req.store._id;

        const [totalProducts, pendingOrders, completedOrders, revenue] = await Promise.all([
            Product.countDocuments({ store: storeId }),
            Order.countDocuments({ store: storeId, status: "pending" }),
            Order.countDocuments({ store: storeId, status: "delivered" }),
            Order.aggregate([
                { $match: { store: storeId, isPaid: true } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ])
        ]);

        res.json({
            totalProducts,
            pendingOrders,
            completedOrders,
            totalRevenue: revenue[0]?.total || 0,
            store: req.store,
        });
    } catch (error) {
        console.error("Error in getSellerDashboard:", error);
        res.status(500).json({ message: "Gagal mengambil data dashboard" });
    }
};

/**
 * Get seller's products
 * GET /api/seller/products
 */
export const getSellerProducts = async (req, res) => {
    try {
        const products = await Product.find({ store: req.store._id })
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        console.error("Error in getSellerProducts:", error);
        res.status(500).json({ message: "Gagal mengambil produk" });
    }
};

/**
 * Create a new product (auto-fill location from store)
 * POST /api/seller/products
 */
export const createSellerProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, images } = req.body;

        if (!name || !description || price === undefined || !category) {
            return res.status(400).json({
                message: "Nama, deskripsi, harga, dan kategori wajib diisi"
            });
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
            return res.status(400).json({ message: "Minimal satu gambar produk diperlukan" });
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
    } catch (error) {
        console.error("Error in createSellerProduct:", error);
        res.status(500).json({ message: "Gagal menambahkan produk" });
    }
};

/**
 * Update a product
 * PUT /api/seller/products/:id
 */
export const updateSellerProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, store: req.store._id });

        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan" });
        }

        const { name, description, price, stock, category, images, newImages } = req.body;

        if (name) product.name = name.trim();
        if (description) product.description = description.trim();
        if (price !== undefined) product.price = Number(price);
        if (stock !== undefined) product.stock = Number(stock);
        if (category) product.category = category;

        // Handle image updates
        if (images) {
            product.images = images; // Keep existing URLs
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
    } catch (error) {
        console.error("Error in updateSellerProduct:", error);
        res.status(500).json({ message: "Gagal memperbarui produk" });
    }
};

/**
 * Delete a product
 * DELETE /api/seller/products/:id
 */
export const deleteSellerProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOneAndDelete({ _id: id, store: req.store._id });

        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan" });
        }

        // Update store product count
        await Store.findByIdAndUpdate(req.store._id, { $inc: { totalProducts: -1 } });

        res.json({ message: "Produk berhasil dihapus" });
    } catch (error) {
        console.error("Error in deleteSellerProduct:", error);
        res.status(500).json({ message: "Gagal menghapus produk" });
    }
};

/**
 * Get orders for seller's store
 * GET /api/seller/orders
 */
export const getSellerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ store: req.store._id })
            .populate("user", "name email imageUrl")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error("Error in getSellerOrders:", error);
        res.status(500).json({ message: "Gagal mengambil pesanan" });
    }
};

/**
 * Update order status (seller can process and ship)
 * PUT /api/seller/orders/:id/status
 */
export const updateSellerOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, trackingNumber, description } = req.body;

        const order = await Order.findOne({ _id: id, store: req.store._id });

        if (!order) {
            return res.status(404).json({ message: "Pesanan tidak ditemukan" });
        }

        // Sellers can only set certain statuses
        const allowedStatuses = ["pending", "shipped"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Status tidak valid. Penjual hanya dapat mengubah ke: pending, shipped"
            });
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
    } catch (error) {
        console.error("Error in updateSellerOrderStatus:", error);
        res.status(500).json({ message: "Gagal memperbarui status pesanan" });
    }
};
