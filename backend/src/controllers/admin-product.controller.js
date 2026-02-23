import cloudinary from "../config/cloudinary.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, stock, category } = req.body;

    if (!name || !description || !price || !stock || !category) {
        throw new AppError("All fields are required", 400);
    }

    if (!req.files || req.files.length === 0) {
        throw new AppError("At least one image is required", 400);
    }

    if (req.files.length > 3) {
        throw new AppError("Maximum 3 images allowed", 400);
    }

    const uploadPromises = req.files.map((file) => {
        return cloudinary.uploader.upload(file.path, {
            folder: "products",
        });
    });

    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map((result) => result.secure_url);

    const latitude = parseFloat(req.body.location?.latitude);
    const longitude = parseFloat(req.body.location?.longitude);
    const address = req.body.location?.address;

    if (!latitude || !longitude || !address) {
        throw new AppError("Product location (latitude, longitude, address) is required", 400);
    }

    const location = { latitude, longitude, address };

    const product = await Product.create({
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        images: imageUrls,
        location,
    });

    res.status(201).json(product);
});

export const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
});

export const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;

    const product = await Product.findById(id);
    if (!product) {
        throw new AppError("Product not found", 404);
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock);
    if (category) product.category = category;

    if (req.files && req.files.length > 0) {
        if (req.files.length > 3) {
            throw new AppError("Maximum 3 images allowed", 400);
        }

        const uploadPromises = req.files.map((file) => {
            return cloudinary.uploader.upload(file.path, {
                folder: "products",
            });
        });

        const uploadResults = await Promise.all(uploadPromises);
        product.images = uploadResults.map((result) => result.secure_url);
    }

    const newLatitude = req.body.location?.latitude;
    const newLongitude = req.body.location?.longitude;
    const newAddress = req.body.location?.address;

    if (newLatitude && newLongitude && newAddress) {
        product.location = {
            latitude: parseFloat(newLatitude),
            longitude: parseFloat(newLongitude),
            address: newAddress,
        };
    }

    await product.save();
    res.status(200).json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        throw new AppError("Product not found", 404);
    }

    if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map((imageUrl) => {
            const publicId = "products/" + imageUrl.split("/products/")[1]?.split(".")[0];
            if (publicId) return cloudinary.uploader.destroy(publicId);
        });
        await Promise.all(deletePromises.filter(Boolean));
    }

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
});
