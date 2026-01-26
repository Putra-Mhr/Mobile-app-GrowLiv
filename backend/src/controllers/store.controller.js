import cloudinary from "../config/cloudinary.js";
import { Store } from "../models/store.model.js";
import { User } from "../models/user.model.js";

/**
 * Register a new store (become a seller)
 * POST /api/stores/register
 */
export const registerStore = async (req, res) => {
    try {
        const userId = req.user._id;

        // Check if user already has a store
        const existingStore = await Store.findOne({ user: userId });
        if (existingStore) {
            return res.status(400).json({ message: "Anda sudah memiliki toko" });
        }

        const { name, description, pickupAddress, imageBase64 } = req.body;

        // Validate required fields
        if (!name || !pickupAddress?.street || !pickupAddress?.city ||
            !pickupAddress?.coordinates?.latitude || !pickupAddress?.coordinates?.longitude) {
            return res.status(400).json({
                message: "Nama toko dan alamat pickup (dengan koordinat) wajib diisi"
            });
        }

        let imageUrl = "";

        // Upload store logo if provided
        if (imageBase64) {
            try {
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: "groliv/stores",
                    transformation: [{ width: 500, height: 500, crop: "fill" }],
                });
                imageUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error("Error uploading store image:", uploadError);
                // Continue without image
            }
        }

        // Create store
        const store = await Store.create({
            user: userId,
            name: name.trim(),
            description: description?.trim() || "",
            imageUrl,
            pickupAddress: {
                street: pickupAddress.street.trim(),
                city: pickupAddress.city.trim(),
                coordinates: {
                    latitude: pickupAddress.coordinates.latitude,
                    longitude: pickupAddress.coordinates.longitude,
                },
            },
        });

        // Update user role to seller
        await User.findByIdAndUpdate(userId, { role: "seller" });

        res.status(201).json({
            message: "Toko berhasil didaftarkan!",
            store,
        });
    } catch (error) {
        console.error("Error in registerStore:", error);
        res.status(500).json({ message: "Gagal mendaftarkan toko" });
    }
};

/**
 * Get current user's store
 * GET /api/stores/my-store
 */
export const getMyStore = async (req, res) => {
    try {
        const store = await Store.findOne({ user: req.user._id });

        if (!store) {
            return res.status(404).json({ message: "Anda belum memiliki toko" });
        }

        res.json(store);
    } catch (error) {
        console.error("Error in getMyStore:", error);
        res.status(500).json({ message: "Gagal mengambil data toko" });
    }
};

/**
 * Update current user's store
 * PUT /api/stores/my-store
 */
export const updateMyStore = async (req, res) => {
    try {
        const store = await Store.findOne({ user: req.user._id });

        if (!store) {
            return res.status(404).json({ message: "Anda belum memiliki toko" });
        }

        const { name, description, pickupAddress, imageBase64 } = req.body;

        // Update fields
        if (name) store.name = name.trim();
        if (description !== undefined) store.description = description.trim();

        if (pickupAddress) {
            if (pickupAddress.street) store.pickupAddress.street = pickupAddress.street.trim();
            if (pickupAddress.city) store.pickupAddress.city = pickupAddress.city.trim();
            if (pickupAddress.coordinates?.latitude && pickupAddress.coordinates?.longitude) {
                store.pickupAddress.coordinates = {
                    latitude: pickupAddress.coordinates.latitude,
                    longitude: pickupAddress.coordinates.longitude,
                };
            }
        }

        // Upload new logo if provided
        if (imageBase64) {
            try {
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: "groliv/stores",
                    transformation: [{ width: 500, height: 500, crop: "fill" }],
                });
                store.imageUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error("Error uploading store image:", uploadError);
            }
        }

        await store.save();

        res.json({
            message: "Toko berhasil diperbarui",
            store,
        });
    } catch (error) {
        console.error("Error in updateMyStore:", error);
        res.status(500).json({ message: "Gagal memperbarui toko" });
    }
};

/**
 * Get store by ID (public)
 * GET /api/stores/:storeId
 */
export const getStoreById = async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await Store.findById(storeId).select("-__v");

        if (!store) {
            return res.status(404).json({ message: "Toko tidak ditemukan" });
        }

        res.json(store);
    } catch (error) {
        console.error("Error in getStoreById:", error);
        res.status(500).json({ message: "Gagal mengambil data toko" });
    }
};
