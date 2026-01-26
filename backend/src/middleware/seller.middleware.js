import { Store } from "../models/store.model.js";

/**
 * Middleware to check if user is a seller
 */
export const sellerOnly = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (req.user.role !== "seller" && req.user.role !== "admin") {
            return res.status(403).json({
                message: "Akses ditolak. Anda harus menjadi penjual untuk mengakses fitur ini."
            });
        }

        // Attach store to request for seller operations
        const store = await Store.findOne({ user: req.user._id });
        if (!store && req.user.role === "seller") {
            return res.status(400).json({
                message: "Toko tidak ditemukan. Silakan daftarkan toko terlebih dahulu."
            });
        }

        req.store = store;
        next();
    } catch (error) {
        console.error("Error in sellerOnly middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
