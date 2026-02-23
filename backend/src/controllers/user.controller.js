import { User } from "../models/user.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const addAddress = asyncHandler(async (req, res) => {
  const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, coordinates, isDefault } =
    req.body;

  const user = req.user;

  if (!fullName || !streetAddress || !city || !state || !zipCode) {
    throw new AppError("Missing required address fields", 400);
  }

  // if this is set as default, unset all other defaults
  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  user.addresses.push({
    label,
    fullName,
    streetAddress,
    city,
    state,
    zipCode,
    phoneNumber,
    coordinates,
    isDefault: isDefault || false,
  });

  await user.save();

  res.status(201).json({ message: "Address added successfully", addresses: user.addresses });
});

export const getAddresses = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json({ addresses: user.addresses });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, coordinates, isDefault } =
    req.body;

  const { addressId } = req.params;

  const user = req.user;
  const address = user.addresses.id(addressId);
  if (!address) {
    throw new AppError("Address not found", 404);
  }

  // if this is set as default, unset all other defaults
  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  address.label = label || address.label;
  address.fullName = fullName || address.fullName;
  address.streetAddress = streetAddress || address.streetAddress;
  address.city = city || address.city;
  address.state = state || address.state;
  address.zipCode = zipCode || address.zipCode;
  address.phoneNumber = phoneNumber || address.phoneNumber;
  address.coordinates = coordinates || address.coordinates;
  address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

  await user.save();

  res.status(200).json({ message: "Address updated successfully", addresses: user.addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const user = req.user;

  user.addresses.pull(addressId);
  await user.save();

  res.status(200).json({ message: "Address deleted successfully", addresses: user.addresses });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const user = req.user;

  if (user.wishlist.includes(productId)) {
    throw new AppError("Product already in wishlist", 400);
  }

  user.wishlist.push(productId);
  await user.save();

  res.status(200).json({ message: "Product added to wishlist", wishlist: user.wishlist });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = req.user;

  if (!user.wishlist.includes(productId)) {
    throw new AppError("Product not found in wishlist", 400);
  }

  user.wishlist.pull(productId);
  await user.save();

  res.status(200).json({ message: "Product removed from wishlist", wishlist: user.wishlist });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.status(200).json({ wishlist: user.wishlist });
});

// Profile management
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    profile: {
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      phoneNumber: user.phoneNumber || "",
      birthDate: user.birthDate || null,
      gender: user.gender || "",
      bio: user.bio || "",
      role: user.role || "user",
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phoneNumber, birthDate, gender, bio, preferences } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (birthDate !== undefined) user.birthDate = birthDate;
  if (gender !== undefined) user.gender = gender;
  if (bio !== undefined) user.bio = bio;

  if (preferences !== undefined) {
    if (!user.preferences) {
      user.preferences = {};
    }
    if (preferences.deliveryTime !== undefined) {
      user.preferences.deliveryTime = preferences.deliveryTime;
    }
    if (preferences.favoriteCategories !== undefined) {
      user.preferences.favoriteCategories = preferences.favoriteCategories;
    }
  }

  await user.save();

  res.status(200).json({
    message: "Profile updated successfully",
    profile: {
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      phoneNumber: user.phoneNumber || "",
      birthDate: user.birthDate || null,
      gender: user.gender || "",
      bio: user.bio || "",
      preferences: user.preferences || {},
    },
  });
});

// Onboarding management
export const getOnboardingStatus = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    onboardingCompleted: user.onboardingCompleted || false,
    needsOnboarding: !user.onboardingCompleted,
  });
});

export const completeOnboarding = asyncHandler(async (req, res) => {
  const user = req.user;

  user.onboardingCompleted = true;
  await user.save();

  res.status(200).json({
    message: "Onboarding completed successfully",
    onboardingCompleted: true,
  });
});

// Privacy Settings management
export const getPrivacySettings = asyncHandler(async (req, res) => {
  const user = req.user;

  const settings = user.privacySettings || {
    biometricEnabled: false,
    pushNotifications: true,
    emailNotifications: true,
    marketingEmails: false,
    shareData: false,
  };

  res.status(200).json({ privacySettings: settings });
});

export const updatePrivacySettings = asyncHandler(async (req, res) => {
  const { biometricEnabled, pushNotifications, emailNotifications, marketingEmails, shareData } = req.body;
  const user = req.user;

  if (!user.privacySettings) {
    user.privacySettings = {};
  }

  if (biometricEnabled !== undefined) user.privacySettings.biometricEnabled = biometricEnabled;
  if (pushNotifications !== undefined) user.privacySettings.pushNotifications = pushNotifications;
  if (emailNotifications !== undefined) user.privacySettings.emailNotifications = emailNotifications;
  if (marketingEmails !== undefined) user.privacySettings.marketingEmails = marketingEmails;
  if (shareData !== undefined) user.privacySettings.shareData = shareData;

  await user.save();

  res.status(200).json({
    message: "Privacy settings updated successfully",
    privacySettings: user.privacySettings,
  });
});

// Export user data
export const exportUserData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");

  const exportData = {
    exportDate: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      birthDate: user.birthDate || null,
      gender: user.gender || "",
      bio: user.bio || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    addresses: user.addresses.map((addr) => ({
      label: addr.label,
      fullName: addr.fullName,
      streetAddress: addr.streetAddress,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      phoneNumber: addr.phoneNumber,
      isDefault: addr.isDefault,
    })),
    wishlist: user.wishlist.map((product) => ({
      id: product._id,
      name: product.name,
      price: product.price,
    })),
    privacySettings: user.privacySettings || {},
  };

  res.status(200).json({
    message: "Data exported successfully",
    data: exportData,
  });
});

// Delete user account (Soft Delete)
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  const userId = user._id;

  const { Cart } = await import("../models/cart.model.js");
  const { Order } = await import("../models/order.model.js");

  // 1. Mark user as deleted (soft delete)
  user.deletedAt = new Date();

  // 2. Anonymize personal data
  user.name = "Deleted User";
  user.email = `deleted_${userId}@deleted.local`;
  user.phoneNumber = "";
  user.birthDate = null;
  user.gender = "";
  user.bio = "";
  user.imageUrl = "";

  // 3. Clear addresses
  user.addresses = [];

  // 4. Clear wishlist
  user.wishlist = [];

  await user.save();

  // 5. Delete cart (personal shopping data)
  await Cart.deleteOne({ user: userId });
  console.log(`Deleted cart for user ${userId}`);

  // 6. Anonymize orders (keep for sellers but remove personal info)
  const ordersUpdated = await Order.updateMany(
    { user: userId },
    {
      $set: {
        "shippingAddress.fullName": "Deleted User",
        "shippingAddress.streetAddress": "[Redacted]",
        "shippingAddress.phoneNumber": "[Redacted]",
      },
    }
  );
  console.log(`Anonymized ${ordersUpdated.modifiedCount} orders for user ${userId}`);

  res.status(200).json({
    message: "Account deleted successfully. Your personal data has been removed.",
  });
});
