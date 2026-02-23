import cloudinary from "../config/cloudinary.js";
import { Store } from "../models/store.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Register a new store (become a seller)
 * POST /api/stores/register
 */
export const registerStore = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Check if user already has a store
    const existingStore = await Store.findOne({ user: userId });
    if (existingStore) {
        throw new AppError("Anda sudah memiliki toko", 400);
    }

    const { name, description, pickupAddress, imageBase64 } = req.body;

    // Validate required fields
    if (!name || !pickupAddress?.street || !pickupAddress?.city ||
        !pickupAddress?.coordinates?.latitude || !pickupAddress?.coordinates?.longitude) {
        throw new AppError("Nama toko dan alamat pickup (dengan koordinat) wajib diisi", 400);
    }

    let imageUrl = "";

    // Upload store logo if provided — inner try-catch because upload failure is non-fatal
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
});

/**
 * Get current user's store
 * GET /api/stores/my-store
 */
export const getMyStore = asyncHandler(async (req, res) => {
    const store = await Store.findOne({ user: req.user._id });

    if (!store) {
        throw new AppError("Anda belum memiliki toko", 404);
    }

    res.json(store);
});

/**
 * Update current user's store
 * PUT /api/stores/my-store
 */
export const updateMyStore = asyncHandler(async (req, res) => {
    const store = await Store.findOne({ user: req.user._id });

    if (!store) {
        throw new AppError("Anda belum memiliki toko", 404);
    }

    const { name, description, pickupAddress, imageBase64 } = req.body;

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

    // Upload new logo if provided — inner try-catch because upload failure is non-fatal
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
});

/**
 * Get store by ID (public)
 * GET /api/stores/:storeId
 */
export const getStoreById = asyncHandler(async (req, res) => {
    const { storeId } = req.params;

    const store = await Store.findById(storeId).select("-__v");

    if (!store) {
        throw new AppError("Toko tidak ditemukan", 404);
    }

    res.json(store);
});
